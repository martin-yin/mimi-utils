import type { AxiosRequestHeaders, AxiosResponse, Canceler } from 'axios';

export interface UploadProgressEvent extends Partial<ProgressEvent> {
  percent?: number;
}

export interface SimpleFile extends File {
  uid: string;
}

export type UploadRequestMethod = 'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch';

export interface UploadRequestError extends Error {
  status?: number;
  method?: UploadRequestMethod;
  url?: string;
}

export type ProcessFileType = {
  data: Record<string, unknown> | any;
  parsedFile: SimpleFile | any;
  origin: SimpleFile | any;
};

export type BeforeUploadFileType = File | Blob | boolean | string;

export type OtherDataType = Record<string, unknown> | SimpleFile | File | Blob;

export type RquestType = {
  url: string;
  method: UploadRequestMethod;
  headers?: AxiosRequestHeaders;
  data?: Record<string, unknown> | FormData;
  onProgress?: (progressEvent: UploadProgressEvent, otherData?: OtherDataType) => void;
  onSuccess?: (ret: any) => void;
  onError?: (err: UploadRequestError) => void;
  cancel?: Canceler;
};

export interface UploadRequestOption extends RquestType {
  url: string;
  filename: string;
  data?: Record<string, unknown>;
  file: SimpleFile | File | Blob;
}

export type SimpleSectionUploadType = {
  //上传切片的地址
  chunkUrl: string;
  // 合并文件地址
  mergeChunkUrl: string;
  // 每个切片的大小
  chunkSize: number;
  // 已经上传过的文件切片
  uploadFileChunkList?: Array<string>;
  onProgress?: (progress: string) => void;
  // 当切片上传完成时触发
  onUploadChunkSuccess?: () => void;
  // 当所有切片上传完成时触发
  onUploadDone?: (res: any) => void;
};

export type ChunkType = {
  file: Blob;
  filename: string;
};

export type DataType = Promise<Record<string, unknown>> | Record<string, unknown>;

export interface SimpleUploadOptionsType extends Omit<UploadRequestOption, 'data'> {
  name?: 'File';
  beforeUpload?: (
    files: SimpleFile,
    fileList: SimpleFile[]
  ) => BeforeUploadFileType | Promise<void | BeforeUploadFileType>;
  data?: (file: File) => Promise<Record<string, unknown>> | Record<string, unknown>;
}
