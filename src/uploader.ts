import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandOutput,
  ObjectCannedACL,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  NodeHttpHandler,
  NodeHttpHandlerOptions,
} from "@smithy/node-http-handler"
import url from "url"
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent"
import { IImgInfo } from "picgo"
import { extractInfo, getProxyAgent } from "./utils"
import { IS3UserConfig } from "./config"

export interface IUploadResult {
  index: number
  key: string
  url: string
  imgURL: string
  versionId?: string
  eTag?: string
}

function createS3Client(opts: IS3UserConfig): S3Client {
  let sslEnabled = true
  try {
    const u = url.parse(opts.endpoint)
    sslEnabled = u.protocol === "https:"
  } catch {
    // eslint-disable-next-line no-empty
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
    region: opts.region || "auto",
    endpoint: opts.endpoint || undefined,
    credentials: {
      accessKeyId: opts.accessKeyID,
      secretAccessKey: opts.secretAccessKey,
    },
    tls: sslEnabled,
    forcePathStyle: opts.pathStyleAccess,
    requestHandler: new NodeHttpHandler(httpHandlerOpts),
  }

  const client = new S3Client(clientOptions)
  return client
}

interface createUploadTaskOpts {
  client: S3Client
  bucketName: string
  path: string
  item: IImgInfo
  index: number
  acl: string
  urlPrefix?: string
}

async function createUploadTask(
  opts: createUploadTaskOpts,
): Promise<IUploadResult> {
  if (!opts.item.buffer && !opts.item.base64Image) {
    return Promise.reject(new Error("undefined image"))
  }

  let body: Buffer
  let contentType: string
  let contentEncoding: string

  try {
    ;({ body, contentType, contentEncoding } = await extractInfo(opts.item))
  } catch (err) {
    return Promise.reject(err)
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

  let output: PutObjectCommandOutput
  try {
    output = await opts.client.send(command)
  } catch (err) {
    return Promise.reject(err)
  }

  let url: string
  if (!opts.urlPrefix) {
    try {
      url = await getFileURL(opts, output.ETag, output.VersionId)
    } catch (err) {
      return Promise.reject(err)
    }
  } else {
    url = `${opts.urlPrefix}/${opts.path}`
  }

  return {
    index: opts.index,
    key: opts.path,
    url: url,
    imgURL: url,
    versionId: output.VersionId,
    eTag: output.ETag,
  }
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
