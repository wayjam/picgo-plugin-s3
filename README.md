## picgo-plugin-s3

[![github-action](https://github.com/wayjam/picgo-plugin-s3/workflows/publish/badge.svg)](https://github.com/wayjam/picgo-plugin-s3/actions/workflows/publish.yaml)
[![license](https://img.shields.io/github/license/wayjam/picgo-plugin-s3)](https://github.com/wayjam/picgo-plugin-s3/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/picgo-plugin-s3?style=flat)](https://www.npmjs.com/package/picgo-plugin-s3)

[PicGo](https://github.com/PicGo/PicGo-Core) Amazon S3 上传插件。

- 支持 Amazon S3 与其他兼容 S3 API 的云存储 (例如 Backblaze B2)。
- 支持 PicGo GUI。
- 支持 MinIO。

### 安装 (Installation)

GUI 用户可直接在插件市场搜索 `s3` 并下载。

Core 用户可执行 `picgo add s3` 命令安装。

### 配置 (Configuration)

```sh
picgo set uploader s3
```

| Key | 说明 | 示例 |
| :--- | :--- | :--- |
| `accessKeyID` | AWS 凭证 ID。 | |
| `secretAccessKey` | AWS 凭证密钥。 | |
| `bucketName` | S3 桶名称。 | `gallery` |
| `uploadPath` | 上传路径，详细配置请查看以下说明。 | `{year}/{month}/{fullName}` |
| `endpoint` | 指定自定义终端节点。 | `s3.us-west-2.amazonaws.com` |
| `proxy` | 代理地址，支持 http 代理。 | `http://127.0.0.1:1080` |
| `region` | 指定执行服务请求的区域。 | `us-west-1` |
| `pathStyleAccess` | 是否启用 S3 Path style 访问模式。<br>例如 `https://s3.amazonaws.com/<bucketName>/<key>`。<br>使用 MinIO 时请设置为 `true`。 | 默认为 `false` |
| `rejectUnauthorized`| 是否拒绝无效的 TLS 证书连接。<br>如上传失败日志显示证书问题可设置为 `false`。 | 默认为 `true` |
| `acl` | 访问控制列表 (ACL)，用于设置资源的访问策略。<br>可选值: `private`, `public-read`, `public-read-write`, `authenticated-read`, `aws-exec-read`, `bucket-owner-read`, `bucket-owner-full-control`。 | 默认为 `public-read` |
| `outputURLPattern` | 自定义输出 URL 模板，详细配置请查看以下说明。 | `{protocol}://{host}:{port}/{path}` |
| `urlPrefix` | **[已废弃]** 自定义 URL 前缀。请使用 `outputURLPattern`。 | `https://img.example.com/my-blog/` |
| `urlSuffix` | **[已废弃]** 自定义 URL 后缀。请使用 `outputURLPattern`。 | `?oxx=xxx` |
| `disableBucketPrefixToURL` | **[已废弃]** 禁用 URL 中的 bucket 前缀。请使用 `outputURLPattern`。 | 默认为 `false` |

---

#### 通用占位符

`uploadPath` 和 `outputURLPattern` 均支持通用占位符，插件会将其替换为实际变量。

| 占位符 | 描述 |
| :--- | :--- |
| `{year}` | 年 |
| `{month}` | 月 |
| `{day}` | 日 |
| `{hour}` | 时 |
| `{minute}` | 分 |
| `{second}` | 秒 |
| `{millisecond}` | 毫秒 |
| `{timestamp}` | Unix 时间戳 (秒) |
| `{timestampMS}` | Unix 时间戳 (毫秒) |

#### 上传路径 (`uploadPath`)

除了通用占位符外，还支持以下变量：

| 占位符 | 描述 |
| :--- | :--- |
| `{fullName}` | 完整文件名 (含扩展名) |
| `{fileName}` | 文件名 (不含扩展名) |
| `{extName}` | 扩展名 (不含 `.`) |
| `{md5}` | 图片 MD5 |
| `{sha1}` | 图片 SHA1 |
| `{sha256}` | 图片 SHA256 |

对于 MD5、SHA1、SHA256，支持这几种截断方式：

- `{sha256:2}`：从第三个字符开始，例如 `abcd -> cd`
- `{sha256:2,4}`：从第三个字符开始，截取长度为4，例如 `abcdefgh`

---

#### 自定义输出 URL 模板 (`outputURLPattern`)

此配置将替代已废弃的 `urlPrefix`、`urlSuffix` 和 `disableBucketPrefixToURL`。

除了通用占位符外，还支持以下变量：

| 占位符 | 描述 | 示例 |
| :--- | :--- | :--- |
| `{protocol}` | URL 协议 | `http` 或 `https` |
| `{host}` | URL 域名 | `s3.amazonaws.com` |
| `{port}` | URL 端口 | `80` |
| `{dir}` | 上传目录 | `xxx/2024/12` |
| `{uploadedFileName}` | 上传后的文件名 (含扩展名) | `4aa4f41e38817e5fd38ac870f40dbc70.jpg` |
| `{path}` | 完整路径 (`{dir}/{uploadedFileName}`) | `xxx/2024/12/4aa4f41e38817e5fd38ac870f40dbc70.jpg` |
| `{fileName}` | **源**文件名 (含扩展名) | `test.jpg` |
| `{extName}` | **源**文件扩展名 (不含 `.`) | `jpg` |
| `{query}` | URL 查询参数 (不含 `?`) | `height=100&width=200` |
| `{hash}` | URL hash (不含 `#`) | `abc` |
| `{bucket}` | S3 桶名 | `my-bucket` |

##### 正则替换

每个变量都支持通过正则表达式进行替换(正则替换表达式中间不能有空格)。

**语法:**
```
{payload:/pattern/flags,'replacement'}
```

**示例:**
假设配置为 `{protocol}://example.com/{path:/testBucket/i,'myimage'}`，
并且原始 URL 为 `https://cluster.s3.example.com/testBucket/image.jpg`，
则最终生成的 URL 为 `https://example.com/myimage/image.jpg`。

---

#### 完整示例 (Example)

```json
{
  "picgo-plugin-s3": {
    "accessKeyID": "xxx",
    "secretAccessKey": "xxxxx",
    "bucketName": "my-bucket",
    "uploadPath": "{year}/{md5}.{extName}",
    "endpoint": "s3.us-west-000.backblazeb2.com",
    "outputURLPattern": "https://img.example.com/{bucket}/{path}"
  }
}
```
如果 PicGo 按以上配置，上传 `sample.png`，最终得到的图片地址可能为：`https://img.example.com/my-bucket/2021/4aa4f41e38817e5fd38ac870f40dbc70.png`。

## 发布 (Publish)

执行以下任一命令，会自动更新 `package.json` 的版本号并生成一个 commit 推送到远程仓库。GitHub Action 将会自动编译、打包并发布到 NPM。

```sh
# 更新补丁版本 (patch)
npm run patch

# 更新次要版本 (minor)
npm run minor

# 更新主要版本 (major)
npm run major
```

## 开发 (Development)

1. Clone this repo
2. `npm i && npm run dev`
3. `cd ~/.picgo && npm install ${path_to_the_repo}`

## 贡献 (Contributing)

欢迎提交 Pull Request。对于重大更改，请先开一个 Issue 进行讨论。

## 许可证 (License)

Released under the [MIT License](https://github.com/wayjam/picgo-plugin-s3/blob/main/LICENSE).