import { IPicGo, IPluginConfig } from "picgo";

export interface IS3UserConfig {
  accessKeyID: string;
  secretAccessKey: string;
  bucketName: string;
  uploadPath: string;
  region?: string;
  endpoint?: string;
  proxy?: string;
  pathStyleAccess?: boolean;
  rejectUnauthorized?: boolean;
  acl?: string;
  disableBucketPrefixToURL?: boolean; //  deprecated, use `outputUrlPattern` instead.
  urlPrefix?: string; //  deprecated, use `outputUrlPattern` instead.
  urlSuffix?: string; //  deprecated, use `outputUrlPattern` instead.
  outputURLPattern?: string;
}

function mergePluginConfig(userConfig: IS3UserConfig): IPluginConfig[] {
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
      alias: "上传文件路径",
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
      name: "pathStyleAccess",
      type: "confirm",
      default: userConfig.pathStyleAccess || false,
      message: "enable s3ForcePathStyle or not",
      required: false,
      alias: "ForcePathStyle",
    },
    {
      name: "outputURLPattern",
      type: "input",
      default: userConfig.outputURLPattern || "",
      message: "自定义输出 URL 模板",
      required: false,
      alias: "自定义输出 URL 模板",
    },
    {
      name: "urlPrefix",
      type: "input",
      default: userConfig.urlPrefix,
      message: "https://img.example.com/bucket-name/（已废弃，请使用 outputURLPattern）",
      required: false,
      alias: "设置输出图片URL前缀",
    },
    {
      name: "urlSuffix",
      type: "input",
      default: userConfig.urlSuffix || "",
      message: "例如 ?x-oss-process=xxx（已废弃，请使用 outputURLPattern）",
      required: false,
      alias: "设定输出图片URL后缀",
    },
    {
      name: "disableBucketPrefixToURL",
      type: "confirm",
      default: userConfig.disableBucketPrefixToURL || false,
      message:
        "开启 `pathStyleAccess` 时，是否要禁用最终生成URL中添加 bucket 前缀（已废弃，请使用 outputURLPattern）",
      required: false,
      alias: "Bucket 前缀",
    },
  ];
}

export const getPluginConfig = (ctx: IPicGo): IPluginConfig[] => {
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
  return mergePluginConfig(userConfig)
}


export function loadUserConfig(ctx: IPicGo): IS3UserConfig {
  const userConfig: IS3UserConfig = ctx.getConfig("picBed.aws-s3")
  if (!userConfig) {
    throw new Error("Can't find amazon s3 uploader config")
  }

  return userConfig
}
