interface NoticeStrBase {
  version: number;
}

export interface NoticeStrMessage extends NoticeStrBase {
  title: string;
  text: string | undefined;
  createdAt: number;

  recipients: Array<{
    pubkey: string;
    sendOkRelays:
      | Array<{
          url: string;
          at: number;
        }>
      | undefined;
    sendFailedRelays:
      | Array<{
          url: string;
          at: number;
        }>
      | undefined;
  }>;
}

// export class NoticeStrMessage {
//   get noOfRecipientsSendOk() {
//     return this.data.recipients.filter((x) => (x.sendOkRelays?.length ?? 0) > 0)
//       .length;
//   }

//   get noOfRecipientsSendFailed() {
//     return this.data.recipients.filter(
//       (x) => (x.sendFailedRelays?.length ?? 0) > 0
//     ).length;
//   }

//   get noOfRecipientsSendOutstanding() {
//     return this.data.recipients.filter(
//       (x) =>
//         typeof x.sendOkRelays === 'undefined' &&
//         typeof x.sendFailedRelays === 'undefined'
//     ).length;
//   }

//   constructor(public data: NoticeStrMessage) {}
// }
