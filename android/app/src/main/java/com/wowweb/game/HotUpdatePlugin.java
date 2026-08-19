package com.wowweb.game;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/**
 * 在线增量更新插件:
 * 将下载的 Web 资源 zip(补丁或全量)解压到应用内部存储,并把 WebView 的
 * 资源加载路径切换到该目录(官方 Bridge.setServerBasePath 热更新机制)。
 * 之后由 JS 端调用 applyUpdate 触发切换与重载。
 */
@CapacitorPlugin(name = "HotUpdate")
public class HotUpdatePlugin extends Plugin {

    private static final String UPDATES_DIR = "updates";

    /** 当前生效的资源目录:更新目录返回 {dir, version},内置资源返回 null */
    @PluginMethod
    public void getActiveUpdate(PluginCall call) {
        String base = getBridge().getServerBasePath();
        File updatesRoot = new File(getContext().getFilesDir(), UPDATES_DIR);
        if (base != null && base.startsWith(updatesRoot.getAbsolutePath())) {
            File dir = new File(base);
            JSObject ret = new JSObject();
            ret.put("dir", dir.getName());
            ret.put("version", readMetaVersion(dir));
            call.resolve(ret);
        } else {
            call.resolve(new JSObject());
        }
    }

    /**
     * 应用更新:options { mode: "full"|"patch", zipPath, dirName, version }
     * - full : 解压 zip 到 <files>/updates/<dirName>(全量资源)
     * - patch: 先复制当前生效的更新目录,再叠加补丁 zip(增量更新)
     * 完成后切换加载路径并重载页面。
     */
    @PluginMethod
    public void applyUpdate(PluginCall call) {
        String mode = call.getString("mode", "full");
        String zipPath = call.getString("zipPath");
        String dirName = call.getString("dirName");
        String version = call.getString("version", "");
        if (zipPath == null || dirName == null || dirName.contains("..")) {
            call.reject("参数缺失或非法");
            return;
        }
        try {
            File updatesRoot = new File(getContext().getFilesDir(), UPDATES_DIR);
            if (!updatesRoot.exists() && !updatesRoot.mkdirs()) {
                call.reject("无法创建更新目录");
                return;
            }
            File target = new File(updatesRoot, dirName);
            if (target.exists()) deleteRecursively(target);
            if ("patch".equals(mode)) {
                // 从当前生效的更新目录复制基础资源
                File src = new File(getBridge().getServerBasePath());
                if (!src.exists() || !src.isDirectory()) {
                    call.reject("补丁模式缺少基础目录,请使用全量更新");
                    return;
                }
                copyRecursively(src, target);
            }
            if (!target.exists() && !target.mkdirs()) {
                call.reject("无法创建目标目录");
                return;
            }
            File zipFile = new File(stripFileScheme(zipPath));
            if (!zipFile.exists()) {
                call.reject("更新包不存在: " + zipFile.getAbsolutePath());
                return;
            }
            extractZip(zipFile, target);
            writeMeta(target, version);
            // 切换 WebView 加载路径并重载
            getBridge().setServerBasePath(target.getAbsolutePath());
            call.resolve(new JSObject().put("ok", true));
        } catch (Exception e) {
            call.reject("应用更新失败: " + e.getMessage());
        }
    }

    /** 回退到应用内置资源 */
    @PluginMethod
    public void resetToBundled(PluginCall call) {
        getBridge().setServerAssetPath(Bridge.DEFAULT_WEB_ASSET_DIR);
        call.resolve(new JSObject().put("ok", true));
    }

    // ---------- 内部工具 ----------

    private String stripFileScheme(String p) {
        if (p == null) return p;
        if (p.startsWith("file://")) p = p.substring("file://".length());
        return p;
    }

    private void extractZip(File zipFile, File targetDir) throws IOException {
        try (ZipFile zip = new ZipFile(zipFile)) {
            Enumeration<? extends ZipEntry> entries = zip.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                if (entry.isDirectory()) continue;
                String name = entry.getName();
                // zip-slip 防护:拒绝绝对路径与 .. 逃逸
                File out = new File(targetDir, name);
                String canonicalTarget = targetDir.getCanonicalPath();
                String canonicalOut = out.getCanonicalPath();
                if (!canonicalOut.startsWith(canonicalTarget + File.separator)) {
                    throw new IOException("非法路径: " + name);
                }
                File parent = out.getParentFile();
                if (parent != null && !parent.exists() && !parent.mkdirs()) {
                    throw new IOException("无法创建目录: " + parent);
                }
                try (InputStream in = zip.getInputStream(entry);
                     OutputStream fos = new FileOutputStream(out)) {
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = in.read(buf)) != -1) fos.write(buf, 0, n);
                }
            }
        }
    }

    private void writeMeta(File dir, String version) throws IOException {
        String json = "{\"version\":\"" + version + "\"}\n";
        try (FileOutputStream fos = new FileOutputStream(new File(dir, ".hotupdate.json"))) {
            fos.write(json.getBytes(StandardCharsets.UTF_8));
        }
    }

    private String readMetaVersion(File dir) {
        File meta = new File(dir, ".hotupdate.json");
        if (!meta.exists()) return null;
        try (FileInputStream fis = new FileInputStream(meta)) {
            byte[] data = new byte[(int) Math.min(meta.length(), 4096)];
            int n = fis.read(data);
            String json = new String(data, 0, n, StandardCharsets.UTF_8);
            int start = json.indexOf("\"version\":\"");
            if (start >= 0) {
                start += "\"version\":\"".length();
                int end = json.indexOf('"', start);
                if (end > start) return json.substring(start, end);
            }
        } catch (IOException ignored) {
        }
        return null;
    }

    private void copyRecursively(File src, File dst) throws IOException {
        if (src.isDirectory()) {
            if (!dst.exists() && !dst.mkdirs()) throw new IOException("无法创建目录: " + dst);
            File[] children = src.listFiles();
            if (children != null) {
                for (File c : children) copyRecursively(c, new File(dst, c.getName()));
            }
        } else {
            try (InputStream in = new FileInputStream(src);
                 OutputStream out = new FileOutputStream(dst)) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            }
        }
    }

    private void deleteRecursively(File f) {
        if (f.isDirectory()) {
            File[] children = f.listFiles();
            if (children != null) for (File c : children) deleteRecursively(c);
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }
}
