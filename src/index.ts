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
      bucketEndpoint: false,
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
        alias: "桶",
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
        message: "enable path-style-access or not",
        required: false,
        alias: "PathStyleAccess",
      },
      {
        name: "rejectUnauthorized",
        type: "confirm",
        default: userConfig.rejectUnauthorized || true,
        message: "是否拒绝无效TLS证书连接",
        required: false,
        alias: "rejectUnauthorized",
      },
      {
        name: "bucketEndpoint",
        type: "confirm",
        default: userConfig.bucketEndpoint || false,
        message:
          "提供的Endpoint是否针对单个存储桶（如果它针对根 API 端点，则为 false）",
        required: false,
        alias: "bucketEndpoint",
      },
      {
        name: "acl",
        type: "input",
        default: userConfig.acl || "public-read",
        message: "上传资源的访问策略",
        required: false,
        alias: "ACL 访问控制列表",
      },
    ]
  }

  const handle = async (ctx: PicGo) => {
    const userConfig: IS3UserConfig = ctx.getConfig("picBed.aws-s3")
    if (!userConfig) {
      throw new Error("Can't find amazon s3 uploader config")
    }
    if (userConfig.urlPrefix) {
      userConfig.urlPrefix = userConfig.urlPrefix.replace(/\/?$/, "")
    }

    const client = uploader.createS3Client(userConfig)
    const output = ctx.output
    const tasks = output.map((item, idx) =>
      uploader.createUploadTask(
        client,
        userConfig.bucketName,
        formatPath(item, userConfig.uploadPath),
        item,
        idx,
        userConfig.acl
      )
    )

    try {
      const results: IUploadResult[] = await Promise.all(tasks)
      for (const result of results) {
        const { index, url, imgURL } = result

        delete output[index].buffer
        delete output[index].base64Image
        output[index].url = url
        output[index].imgUrl = url

        if (userConfig.urlPrefix) {
          output[index].url = `${userConfig.urlPrefix}/${imgURL}`
          output[index].imgUrl = `${userConfig.urlPrefix}/${imgURL}`
        }
      }

      return ctx
    } catch (err) {
      ctx.log.error("上传到 Amazon S3 发生错误，请检查配置是否正确")
      ctx.log.error(err)
      ctx.emit("notification", {
        title: "Amazon S3 上传错误",
        body: "请检查配置是否正确",
        text: "",
      })
      throw err
    }
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
