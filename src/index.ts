import { PicGo } from "picgo"
import uploader, { IUploadResult } from "./uploader"
import { formatPath } from "./utils"
import { IS3UserConfig } from "./config"

export = (ctx: PicGo) => {
  const config = (ctx: PicGo) => {
    const defaultConfig: IS3UserConfig = {
      accessKeyID: "",
      secretAccessKey: "",
      bucketName: "",
      uploadPath: "{year}/{month}/{md5}.{extName}",
      pathStyleAccess: false,
      rejectUnauthorized: true,
      acl: "public-read",
    }
    let userConfig = ctx.getConfig<IS3UserConfig>("picBed.aws-s3")
    userConfig = { ...defaultConfig, ...(userConfig || {}) }
    return [
      {
        name: "accessKeyID",
        type: "input",
        default: userConfig.accessKeyID,
        required: true,
        message: "access key id",
        alias: "应用密钥 ID",
      },
      {
        name: "secretAccessKey",
        type: "password",
        default: userConfig.secretAccessKey,
        required: true,
        message: "secret access key",
        alias: "应用密钥",
      },
      {
        name: "bucketName",
        type: "input",
        default: userConfig.bucketName,
        required: true,
        alias: "桶名",
      },
      {
        name: "uploadPath",
        type: "input",
        default: userConfig.uploadPath,
        required: true,
        alias: "文件路径",
      },
      {
        name: "region",
        type: "input",
        default: userConfig.region,
        required: false,
        alias: "地区",
      },
      {
        name: "endpoint",
        type: "input",
        default: userConfig.endpoint,
        required: false,
        alias: "自定义节点",
      },
      {
        name: "proxy",
        type: "input",
        default: userConfig.proxy,
        required: false,
        alias: "代理",
        message: "http://127.0.0.1:1080",
      },
      {
        name: "urlPrefix",
        type: "input",
        default: userConfig.urlPrefix,
        message: "https://img.example.com/bucket-name/",
        required: false,
        alias: "自定义域名",
      },
      {
        name: "pathStyleAccess",
        type: "confirm",
        default: userConfig.pathStyleAccess || false,
        message: "enable s3ForcePathStyle or not",
        required: false,
        alias: "ForcePathStyle",
      },
      {
        name: "rejectUnauthorized",
        type: "confirm",
        default: userConfig.rejectUnauthorized || true,
        message: "是否拒绝无效TLS证书连接",
        required: false,
        alias: "拒绝无效TLS证书连接",
      },
      {
        name: "acl",
        type: "input",
        default: userConfig.acl || "public-read",
        message: "上传资源的访问策略",
        required: false,
        alias: "ACL 访问控制列表",
      },
      {
        name: "disableBucketPrefixToURL",
        type: "input",
        default: userConfig.disableBucketPrefixToURL || false,
        message:
          "开启 `pathStyleAccess` 时，是否要禁用最终生成URL中添加 bucket 前缀",
        required: false,
        alias: "Bucket 前缀",
      },
    ]
  }

  const handle = async (ctx: PicGo) => {
    const userConfig: IS3UserConfig = ctx.getConfig("picBed.aws-s3")
    if (!userConfig) {
      throw new Error("Can't find amazon s3 uploader config")
    }
    let urlPrefix = userConfig.urlPrefix
    if (urlPrefix) {
      urlPrefix = urlPrefix.replace(/\/?$/, "")
      if (userConfig.pathStyleAccess && !userConfig.disableBucketPrefixToURL) {
        urlPrefix += "/" + userConfig.bucketName
      }
    }

    const client = uploader.createS3Client(userConfig)
    const output = ctx.output

    const tasks = output.map((item, idx) =>
      uploader.createUploadTask({
        client,
        index: idx,
        bucketName: userConfig.bucketName,
        path: formatPath(item, userConfig.uploadPath),
        item: item,
        acl: userConfig.acl,
        urlPrefix,
      })
    )

    let results: IUploadResult[]

    try {
      results = await Promise.all(tasks)
    } catch (err) {
      ctx.log.error("上传到 S3 存储发生错误，请检查网络连接和配置是否正确")
      ctx.log.error(err)
      ctx.emit("notification", {
        title: "S3 存储上传错误",
        body: "请检查配置是否正确",
        text: "",
      })
      throw err
    }

    for (const result of results) {
      const { index, url, imgURL } = result
      delete output[index].buffer
      delete output[index].base64Image
      output[index].imgUrl = imgURL
      output[index].url = url
    }

    return ctx
  }

  const register = () => {
    ctx.helper.uploader.register("aws-s3", {
      handle,
      config,
      name: "Amazon S3",
    })
  }
  return {
    register,
  }
}
