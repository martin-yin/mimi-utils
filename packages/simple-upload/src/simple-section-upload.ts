import axios from 'axios';
import SparkMD5 from 'spark-md5';
import type { ChunkType, SimpleSectionUploadType } from './interface';
import upload from './request';

export class SimpleSectionUpload {
  options: SimpleSectionUploadType;
  private spark = new SparkMD5.ArrayBuffer();
  private fileReader = new FileReader();
  private fileChunkList: Array<ChunkType> = [];
  private hash = '';
  private complete = 0;
  private chunkCount = 0;
  constructor(options: SimpleSectionUploadType) {
    this.options = options;
  }

  /**
   * 上传文件
   * @param file
   */
  public async upload(file: File) {
    // 等待切片完成
    await this.fileSection(file);
    this.fileChunkList.forEach(chunk => {
      if (this.options.uploadFileChunkList) {
        const { uploadFileChunkList } = this.options;

        // 如果已经上传过就不再上传了
        if (uploadFileChunkList.length > 0 && uploadFileChunkList.includes(chunk.filename)) {
          this.uploadComplete();

          return;
        }
      }

      this.uploadChunk(chunk);
      // 上传切片
    });
  }

  /**
   * 更新进度条
   */
  private uploadedProgerss() {
    const { complete, chunkCount } = this;
    const { onProgress } = this.options;
    const uploadedProgerss = ((complete / chunkCount) * 100).toFixed(2);

    onProgress?.(uploadedProgerss);
  }

  /**
   * 判断切片上传
   * @returns
   */
  private uploadComplete() {
    this.complete++;
    this.uploadedProgerss();
    const { hash, complete, chunkCount } = this;

    // 如果 complete 小于 切片数量，说明还未上传完。
    if (complete < chunkCount) {
      return;
    }

    // 合并切片接口
    axios
      .request({
        url: this.options.mergeChunkUrl,
        data: { hash, chunkCount },
        method: 'POST'
      })
      .then(res => {
        this.options.onUploadDone?.(res);
      });
  }

  private async uploadChunk({ file, filename }: ChunkType) {
    upload({
      url: this.options.chunkUrl,
      file: file,
      filename,
      method: 'POST',
      onSuccess: () => {
        this.uploadComplete();
      }
    });
  }

  /**
   * 获取文件的哈希和后缀名
   * @param file
   * @returns
   */
  private retriveHash(file: File): Promise<{
    hash: string;
    suffix: string | any;
  }> {
    return new Promise(resolve => {
      this.fileReader.readAsArrayBuffer(file);
      this.fileReader.onload = ev => {
        if (ev.target?.result) {
          this.spark.append(ev.target.result as ArrayBuffer);
          const hash = this.spark.end();
          const suffix = /\.([0-9a-zA-Z]+)$/.exec(file.name)?.unshift();

          resolve({
            hash,
            suffix
          });
        }
      };
    });
  }

  /**
   * 文件切片
   * @param file
   * @returns
   */
  private async fileSection(file: File) {
    const { hash, suffix } = await this.retriveHash(file);
    const { chunkSize } = this.options;

    this.hash = hash;
    let index = 0;

    this.chunkCount = this.computeSectionCount(file.size);

    return new Promise(resolve => {
      try {
        while (index < this.chunkCount) {
          const filename = `${hash}_${index + 1}.${suffix}`;
          const fileChunk = file.slice(index * chunkSize, (index + 1) * chunkSize);

          this.fileChunkList.push({
            file: fileChunk,
            filename: filename
          });
          index++;
        }

        resolve(true);
      } catch (e) {
        throw Error(`切片失败：${e}`);
      }
    });
  }

  /**
   * 计算文件将要被切成多少份
   * @param fileSize number
   */
  private computeSectionCount(fileSize: number): number {
    const { chunkSize } = this.options;

    return Math.ceil(fileSize / chunkSize);
  }
}
