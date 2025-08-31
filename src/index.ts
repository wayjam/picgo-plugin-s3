import { IImgInfo, IPicGo, IPluginConfig } from "picgo"
import uploader, { IUploadResult } from "./uploader"
import { FileNameGenerator, OutputURLGenerator } from "./utils"
import { getPluginConfig, loadUserConfig } from "./config"

const pluginName = "aws-s3"

const upload = async (ctx: IPicGo) => {
  const userConfig = loadUserConfig(ctx)
  const client = uploader.createS3Client(userConfig)
  const output = ctx.output

  const tasks = output.map((item, idx) => {
    item.uploadDate = new Date()
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
    ctx.log.error("Upload S3 storage failed, please check your network connection and configuration")
    throw err
  }

  for (const result of results) {
    let { index, url, key, error } = result
    delete output[index].buffer
    delete output[index].base64Image
    output[index].uploadPath = key
    if (error) {
      output[index].error = error
    } else {
      output[index].url = url
      output[index].imgUrl = url
    }
  }

  return ctx
}

const afterUploadPlugins = (ctx: IPicGo) => {
  const userConfig = loadUserConfig(ctx)

  let errList: IImgInfo[] = []

  ctx.output = ctx.output.reduce((acc: IImgInfo[], item) => {
    if (item.type != pluginName) {
      return [...acc, item]
    }
    if (item.error || (!item.imgUrl && !item.url)) {
      errList.push(item)
      return acc
    }
    const outputURLGenerator = new OutputURLGenerator(userConfig, item)
    const url = outputURLGenerator.format()
    return [...acc, {
      ...item,
      imgUrl: url,
      url: url,
    }]
  }, [])

  if (errList.length > 0) {
    const msg = `S3 Plugin ${errList.length} of ${ctx.output.length + errList.length} failed.`
    for (const item of errList) {
      ctx.log.error(`Item ${item.fileName}:`, item.error.message)
    }
    ctx.emit("notification", {
      title: "S3 Plugin Error",
      body: msg + " Error list: " + errList.map(item => item.fileName).join(", "),
    })
    if (ctx.output.length > 0) {
      ctx.log.error(msg)
    } else {
      throw new Error(msg)
    }
  }
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
