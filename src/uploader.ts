import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  NodeHttpHandler,
  NodeHttpHandlerOptions,
} from "@smithy/node-http-handler"
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent"
import { IImgInfo } from "picgo"
import { extractInfo, getProxyAgent } from "./utils"
import { IS3UserConfig } from "./config"

export interface IUploadResult {
  index: number
  key: string
  url?: string
  versionId?: string
  eTag?: string
  error?: Error
}

function createS3Client(opts: IS3UserConfig): S3Client {
  let sslEnabled = true
  try {
    const u = new URL(opts.endpoint || '')
    sslEnabled = u.protocol === 'https:'
  } catch (err) {
    console.warn('Failed to parse endpoint URL, defaulting to HTTPS:', err)
  }

  const httpHandlerOpts: NodeHttpHandlerOptions = {}
  if (sslEnabled) {
    httpHandlerOpts.httpsAgent = <HttpsProxyAgent>(
      getProxyAgent(opts.proxy, true, opts.rejectUnauthorized)
    )
  } else {
    httpHandlerOpts.httpAgent = <HttpProxyAgent>(
      getProxyAgent(opts.proxy, false, opts.rejectUnauthorized)
    )
  }

  const clientOptions: S3ClientConfig = {
    region: opts.region || 'auto',
    endpoint: opts.endpoint,
    credentials: {
      accessKeyId: opts.accessKeyID,
      secretAccessKey: opts.secretAccessKey,
    },
    tls: sslEnabled,
    forcePathStyle: opts.pathStyleAccess ?? false,
    requestHandler: new NodeHttpHandler(httpHandlerOpts),
  }

  return new S3Client(clientOptions)
}

interface createUploadTaskOpts {
  client: S3Client
  bucketName: string
  path: string // upload path
  item: IImgInfo
  index: number
  acl: string
}

async function createUploadTask(
  opts: createUploadTaskOpts,
): Promise<IUploadResult> {
  let result: IUploadResult = {
    index: opts.index,
    key: opts.path,
  }

  if (!opts.item.buffer && !opts.item.base64Image) {
    result.error =new Error(`"${opts.item.fileName}" No image data provided: buffer or base64Image is required`)
    return result
  }

  let body: Buffer
  let contentType: string
  let contentEncoding: string



  try {
    ({ body, contentType, contentEncoding } = await extractInfo(opts.item))
  } catch (err) {
    result.error = new Error(`Failed to extract ${opts.item.fileName} image info: ${err instanceof Error ? err.message : String(err)}`)
    return result
  }

  const acl: ObjectCannedACL = opts.acl as ObjectCannedACL

  const command = new PutObjectCommand({
    Bucket: opts.bucketName,
    Key: opts.path,
    ACL: acl,
    Body: body,
    ContentType: contentType,
    ContentEncoding: contentEncoding,
  })

  try {
    const output = await opts.client.send(command)
    result.url = await getFileURL(opts, output.ETag || '', output.VersionId || '')
    result.versionId = output.VersionId
    result.eTag = output.ETag
  } catch (err) {
    result.error = new Error(
      `Failed to upload "${opts.item.fileName}" to S3: ${err instanceof Error ? err.message : String(err)}`
    )
  }
  return result
}

async function getFileURL(
  opts: createUploadTaskOpts,
  eTag: string,
  versionId: string,
): Promise<string> {
  try {
    const signedUrl = await getSignedUrl(
      opts.client,
      new GetObjectCommand({
        Bucket: opts.bucketName,
        Key: opts.path,
        IfMatch: eTag,
        VersionId: versionId,
      }),
      { expiresIn: 3600 },
    )
    const urlObject = new URL(signedUrl)
    urlObject.search = ""
    return urlObject.href
  } catch (err) {
    return Promise.reject(err)
  }
}

export default {
  createS3Client,
  createUploadTask,
  getFileURL,
}
