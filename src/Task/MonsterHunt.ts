import { ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import DefaultMonsterHandler from '../monsters/DefaultMonsterHandler.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'

export default class MonsterHunt extends Task {
  MonsterHandler: DefaultMonsterHandler
  proxyMonsterHunt: any
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.proxyMonsterHunt = args.proxyMonsterHunt
    const id = this.proxyMonsterHunt?.id ? this.proxyMonsterHunt?.id : this.bot.character.s.monsterhunt.id
    this.MonsterHandler = new DefaultMonsterHandler(bot, [id])
  }

  async loop (): Promise<void> {
    const monsterHunt = this.proxyMonsterHunt?.id ? this.proxyMonsterHunt.c : this.bot.character?.s?.monsterhunt?.c
    if (!monsterHunt) return this.removeFromQueue()
    await this.MonsterHandler.loop()
  }
}
