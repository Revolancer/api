import { UserTask } from './usertask.type';

export class UserJob {
  task: UserTask;
  extraData: { [key: string]: any };
}
