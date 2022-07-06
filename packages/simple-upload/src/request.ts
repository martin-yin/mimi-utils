import type { AxiosResponse } from 'axios';
import axios from 'axios';
import type { OtherDataType, RquestType, UploadProgressEvent, UploadRequestOption } from './interface';

function getBody(res: AxiosResponse<any, any>) {
  const data = res.data;

  if (!data) {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

export function request(option: RquestType, otherData?: OtherDataType) {
  const { url, data, headers, method, onProgress, onSuccess, onError } = option;

  axios
    .request({
      url,
      data,
      headers,
      method,
      cancelToken: new axios.CancelToken(c => {
        option.cancel = c;
      }),
      onUploadProgress: (e: UploadProgressEvent) => {
        onProgress?.(e, otherData);
      }
    })
    .then(res => {
      onSuccess?.(getBody(res));
    })
    .catch(err => {
      onError?.(err);
    });
}

export default function upload(option: UploadRequestOption) {
  const formData = new FormData();

  if (option?.data) {
    Object.keys(option.data).forEach(key => {
      let value;

      if (option?.data) {
        value = option.data[key];
      }

      if (Array.isArray(value)) {
        value.forEach(item => {
          formData.append(`${key}[]`, item);
        });

        return;
      }

      formData.append(key, value as string | Blob);
    });
  }

  if (option.file instanceof Blob) {
    formData.append(option.filename, option.file, (option.file as any).name);
  } else {
    formData.append(option.filename, option.file);
  }

  const { url, headers, method, onProgress, onSuccess, onError } = option;

  request(
    {
      url,
      data: formData,
      headers,
      method,
      onProgress,
      onSuccess,
      onError
    },
    option.file
  );
}
