import SparkMD5 from 'spark-md5';

export type SimpleSectionUploadType = {
  // 每个切片的大小
  chunkSize: number;
  onProgress?: (progress: string) => void;
};

export class SimpleSectionUpload {
  options: SimpleSectionUploadType;
  private spark = new SparkMD5.ArrayBuffer();
  private fileReader = new FileReader();
  private fileChunkList: Array<{ file: Blob; filename: string }> = [];
  private uploadedFileChunkList: Array<string> = [];

  private complete = 0;
  private sectionCount = 0;
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
    const { uploadedFileChunkList } = this;

    this.fileChunkList.forEach(chunk => {
      // 如果已经上传过就不再上传了
      if (uploadedFileChunkList.length > 0 && uploadedFileChunkList.includes(chunk.filename)) {
        this.uploadComplete();

        return;
      }
      // 上传切片
    });
  }

  /**
   * 更新进度条
   */
  private updateUploadedProgerss() {
    const { complete, sectionCount } = this;
    const { onProgress } = this.options;
    const uploadedProgerss = ((complete / sectionCount) * 100).toFixed(2);

    onProgress?.(uploadedProgerss);
  }

  /**
   * 判断切片上传
   * @returns
   */
  private uploadComplete() {
    this.complete++;
    this.updateUploadedProgerss();
    const { complete, sectionCount } = this;

    // 如果 complete 小于 切片数量，说明还未上传完。
    if (complete < sectionCount) {
      return;
    }
    // 合并切片接口
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
    let index = 0;

    this.sectionCount = this.computeSectionCount(file.size);

    return new Promise(resolve => {
      try {
        while (index < this.sectionCount) {
          this.fileChunkList.push({
            file: file.slice(index * chunkSize, (index + 1) * chunkSize),
            filename: `${hash}_${index + 1}.${suffix}`
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
