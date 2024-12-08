import { IPicGo, IPluginConfig } from "picgo"
import uploader, { IUploadResult } from "./uploader"
import { FileNameGenerator, OutputURLGenerator } from "./utils"
import { getPluginConfig, loadUserConfig } from "./config"

const pluginName = "aws-s3"

const upload = async (ctx: IPicGo) => {
  const userConfig = loadUserConfig(ctx)
  const client = uploader.createS3Client(userConfig)
  const output = ctx.output

  const tasks = output.map((item, idx) => {
    const fileNameGenerator = new FileNameGenerator(item)
    return uploader.createUploadTask({
      client,
      index: idx,
      bucketName: userConfig.bucketName,
      path: fileNameGenerator.format(userConfig.uploadPath),
      item: item,
      acl: userConfig.acl || '',
    })
  }
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
    const { index, url, key } = result
    delete output[index].buffer
    delete output[index].base64Image
    output[index].url = url
    output[index].imgUrl = url
    output[index].uploadPath = key
  }

  return ctx
}

const afterUploadPlugins = (ctx: IPicGo) => {
  const userConfig = loadUserConfig(ctx)

  ctx.output = ctx.output.map((item) => {
    if (item.type != pluginName) {
      return item
    }
    const outputURLGenerator = new OutputURLGenerator(userConfig, item)
    const url = outputURLGenerator.format()
    return {
      ...item,
      imgUrl: url,
      url: url,
    }
  })
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  return getPluginConfig(ctx)
}

export = (ctx: IPicGo) => {
  const register = () => {
    ctx.helper.uploader.register(pluginName, {
      handle: upload,
      config,
      name: "Amazon S3",
    })
    ctx.helper.afterUploadPlugins.register(pluginName, {
      handle: afterUploadPlugins,
      config,
    })
  }
  return {
    register,
  }
}
