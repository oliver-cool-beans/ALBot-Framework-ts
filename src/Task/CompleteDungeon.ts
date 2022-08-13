import { ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import Task from './index.js'
import Crypt from '../Dungeons/Crypt/index.js'
import { taskArgs } from '../types/index.js'

export default class MonsterHunt extends Task {
  DungeonHandler: any
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.DungeonHandler = this.getDungeonHandler('crypt', bot)
  }

  getDungeonHandler (dungeonName: 'crypt', bot: Bot): Crypt {
    return new Crypt(bot)
  }

  async loop (): Promise<void> {
    // const character = this.bot.character
  }
}
