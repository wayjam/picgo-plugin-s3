## picgo-plugin-s3

PicGo AWS S3 上传插件，同事支持 AWS S3 与其他如 backblaze b2 等兼容 S3 API 的云存储。

### 配置

| Key               | 说明                        | 例子                                        |
| ----------------- | --------------------------- | ------------------------------------------- |
| `accessKeyID`     | AWS 凭证 ID                 |                                             |
| `secretAccessKey` | AWS 凭证密钥                |                                             |
| `bucketName`      | S3 桶名称                   | `gallery`                                   |
| `uploadPath`      | 上传路径                    | `{year}/{month}/{fileName}-{md5}.{extName}` |
| `urlPrefix`       | 最终生成图片URL的自定义前缀 | `https://img.example.com/my-blog/`          |
| `endpoint`        | 指定自定义终端节点          | `s3.us-west-2.amazonaws.com`                |
| `region`          | 指定执行服务请求的区域      | `us-west-1`                                 |



#### 上传路径支持 Payload

| payload      | 描述                   |
| ------------ | ---------------------- |
| `{year}`     | 当前日期 - 年          |
| `{month}`    | 当前日期 - 月          |
| `{day}`      | 当前日期 - 日          |
| `{fullName}` | 完整文件名（含扩展名） |
| `{fileName}` | 文件名（不含扩展名）   |
| `{extName}`  | 扩展名（不含`.`）      |
| `{md5}`      | 图片 MD5 计算值        |
| `{sha1}`     | 图片 SHA1 计算值       |
| `sha256`     | 图片 SHA256 计算值     |



#### 例子

```json
    "aws-s3": {
      "accessKeyID": "xxx",
      "secretAccessKey": "xxxxx",
      "bucketName": "my-bucket",
      "uploadPath": "{year}/{md5}.{extName}",
      "endpoint": "s3.us-west-000.backblazeb2.com",
      "urlPrefix": "https://img.example.com/"
    }
```

如果 PicGo 像以上配置，执行上传：`picgo upload sample.png`，则最终得到图片地址为：`https://img.example.com/2021/4aa4f41e38817e5fd38ac870f40dbc70.jpg`