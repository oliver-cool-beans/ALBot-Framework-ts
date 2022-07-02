import { ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import DefaultMonsterHandler from '../monsters/DefaultMonsterHandler.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'

export default class MonsterHunt extends Task {
  MonsterHandler: DefaultMonsterHandler
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.MonsterHandler = new DefaultMonsterHandler(bot, [this.bot.character.s.monsterhunt.id])
  }

  async loop (): Promise<void> {
    const character = this.bot.character
    if (!character?.s?.monsterhunt?.c) return this.removeFromQueue()
    await this.MonsterHandler.loop()
  }
}
