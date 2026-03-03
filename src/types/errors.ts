export type ErrorDetail = {
  code: number;
  status?: number;
  message?: string;
  meta?: any;
}

export function getErrorDetails(error: ERRORS) {
  return ERROR_DETAILS[error] || ERROR_DETAILS[ERRORS.UNKNOWN];
}

export enum ERRORS {
  UNKNOWN = 1000,
  ALREADY_IN_FRIENDS = 1001,
  CHAT_NOT_FOUND = 1002,
}

const ERROR_DETAILS = {
  [ERRORS.UNKNOWN]: {
    code: ERRORS.UNKNOWN,
    status: 500,
    message: 'Sorry! Unknown Error Occured',
  } as ErrorDetail
  ,
  [ERRORS.ALREADY_IN_FRIENDS]: {
    code: ERRORS.ALREADY_IN_FRIENDS,
    status: 400,
    message: 'Already in your friends',
  } as ErrorDetail
  ,
  [ERRORS.CHAT_NOT_FOUND]: {
    code: ERRORS.CHAT_NOT_FOUND,
    status: 400,
    message: 'Chat not found',
  } as ErrorDetail
}