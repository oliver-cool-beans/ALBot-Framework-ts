import { ServerIdentifier, ServerRegion } from 'alclient'
import Bot from '../Bot/index.js'
import DefaultMonsterHandler from '../monsters/DefaultMonsterHandler.js'
import Task from './index.js'
import { taskArgs } from '../types/index.js'

export default class MonsterHunt extends Task {
  MonsterHandler: DefaultMonsterHandler
  proxyMonsterHuntMember: string
  constructor (bot: Bot, priority: number, serverIdentifier: ServerIdentifier, serverRegion: ServerRegion, onStartTasks: Array<Task> = [], onRemoveTasks: Array<Task> = [], args: taskArgs = {}) {
    super(bot, priority, serverIdentifier, serverRegion, onStartTasks, onRemoveTasks, args)
    this.proxyMonsterHuntMember = args.proxyMonsterHunt
    const proxyHunt = this.getPlayerMonsterHunt(this.proxyMonsterHuntMember)
    const id = this.proxyMonsterHuntMember ? proxyHunt?.id : this.bot.character.s.monsterhunt.id
    this.MonsterHandler = new DefaultMonsterHandler(bot, [id])
  }

  private getPlayerMonsterHunt (memberName?: string): {[key: string]: any} | null {
    if (!memberName) return null
    const matchedMember = this.bot.party.findMemberByName(memberName)
    if (!matchedMember || !matchedMember?.character?.s.monsterhunt?.id) return null
    return matchedMember.character.s.monsterhunt
  }

  async loop (): Promise<void> {
    const proxyHunt = this.getPlayerMonsterHunt(this.proxyMonsterHuntMember)
    if (this.proxyMonsterHuntMember && !proxyHunt) return this.removeFromQueue()

    const monsterHunt = this.proxyMonsterHuntMember ? proxyHunt?.c : this.bot.character?.s?.monsterhunt?.c
    if (!monsterHunt) return this.removeFromQueue()
    await this.MonsterHandler.loop()
  }
}
