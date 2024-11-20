## picgo-plugin-s3

![github-action](https://github.com/wayjam/picgo-plugin-s3/workflows/publish/badge.svg)
![license](https://img.shields.io/github/license/wayjam/picgo-plugin-s3)
[![npm](https://img.shields.io/npm/v/picgo-plugin-s3?style=flat)](https://www.npmjs.com/package/picgo-plugin-s3)

[PicGo](https://github.com/PicGo/PicGo-Core) Amazon S3 上传插件。

- 支持 Amazon S3 与其他如 backblaze b2 等兼容 S3 API 的云存储
- 支持 PicGO GUI

### 安装 Installation

GUI 直接搜索 _S3_ 下载即可，Core 版执行 `picgo add s3` 安装。

### 配置 Configuration

```sh
picgo set uploader aws-s3
```

| Key                        | 说明                                               | 例子                                                                                                                                          |
|----------------------------|--------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `accessKeyID`              | AWS 凭证 ID                                        |                                                                                                                                             |
| `secretAccessKey`          | AWS 凭证密钥                                         |                                                                                                                                             |
| `bucketName`               | S3 桶名称                                           | `gallery`                                                                                                                                   |
| `uploadPath`               | 上传路径                                             | `{year}/{month}/{fullName}`                                                                                                                 |
| `urlPrefix`                | 最终生成图片 URL 的自定义前缀                                | `https://img.example.com/my-blog/`                                                                                                          |
| `urlSuffix`                | 最终生成图片 URL 的自定义后缀                                | `?oxx=xxx`                                                                                                                                  |
| `endpoint`                 | 指定自定义终端节点                                        | `s3.us-west-2.amazonaws.com`                                                                                                                |
| `proxy`                    | 代理地址                                             | 支持 http 代理，例如 `http://127.0.0.1:1080`                                                                                                         |
| `region`                   | 指定执行服务请求的区域                                      | `us-west-1`                                                                                                                                 |
| `pathStyleAccess`          | 是否启用 S3 Path style                               | 默认为 `false`，使用 minio 请设置为 `true` (e.g., https://s3.amazonaws.com/<bucketName>/<key> instead of https://<bucketName>.s3.amazonaws.com/<key>) |
| `rejectUnauthorized`       | 是否拒绝无效 TLS 证书连接                                  | 默认为 `true`，如上传失败日志显示证书问题可设置为`false`                                                                                                         |
| `acl`                      | 访问控制列表，上传资源的访问策略                                 | 默认为 `public-read`, AWS 可选 `private"                                                                                                         |"public-read"|"public-read-write"|"authenticated-read"|"aws-exec-read"|"bucket-owner-read"|"bucket-owner-full-control`                                     |
| `disableBucketPrefixToURL` | 开启 `pathStyleAccess` 时，是否要禁用最终生成 URL 中添加 bucket 前缀 | 默认为 `false`                                                                                                                                 |
| `customImagePath`          | 自定义图片路径                                         | `{year}{month}/original/{md5}.{extName}`                                                                                                     |

**上传路径支持 payload：**

| payload         | 描述                   |
| --------------- | ---------------------- |
| `{year}`        | 当前日期 - 年          |
| `{month}`       | 当前日期 - 月          |
| `{day}`         | 当前日期 - 日          |
| `{hour}`        | 当前日期 - 时          |
| `{minute}`      | 当前日期 - 分          |
| `{second}`      | 当前日期 - 秒          |
| `{millisecond}` | 当前日期 - 毫秒        |
| `{fullName}`    | 完整文件名（含扩展名） |
| `{fileName}`    | 文件名（不含扩展名）   |
| `{extName}`     | 扩展名（不含`.`）      |
| `{md5}`         | 图片 MD5 计算值        |
| `{sha1}`        | 图片 SHA1 计算值       |
| `{sha256}`      | 图片 SHA256 计算值     |
| `{timestamp}`   | Unix 时间戳            |
| `{timestampMS}` | Unix 时间戳（毫秒）    |

### 示例 Example

```json
    "aws-s3": {
      "accessKeyID": "xxx",
      "secretAccessKey": "xxxxx",
      "bucketName": "my-bucket",
      "uploadPath": "{year}/{md5}.{extName}",
      "endpoint": "s3.us-west-000.backblazeb2.com",
      "urlPrefix": "https://img.example.com/",
      "customImagePath": "{year}{month}/original/{md5}.{extName}"
    }
```

如果 PicGo 像以上配置，执行上传：`picgo upload sample.png`，则最终得到图片地址为：`https://img.example.com/2021/4aa4f41e38817e5fd38ac870f40dbc70.jpg`

## 发布 Publish

With the following command, a versioned commit which modifies the `version` of `package.json` would be genereated and pushed to the origin. Github Action will automatically compile this pacakage and publish it to NPM.

```sh
npm run patch
npm run minor
npm run major
```

## 贡献 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 许可证 License

Released under the [MIT License](https://github.com/wayjam/picgo-plugin-s3/blob/master/LICENSE).
