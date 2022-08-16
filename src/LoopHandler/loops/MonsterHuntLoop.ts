import Loop from './Loop.js'
import GetMonsterHunt from '../../Task/GetMonsterHunt.js'
import FinishMonsterHunt from '../../Task/FinishMonsterHunt.js'
import MonsterHunt from '../../Task/MonsterHunt.js'
import Bot from '../../Bot/index.js'
import { botConfig } from '../../types/index.js'
import { SNtoServerData } from '../../helpers/index.js'

export default class MonsterHuntLoop extends Loop {
  botConfig: botConfig
  constructor (bot: Bot) {
    super(bot)
    this.botConfig = this.bot.config
  }

  monsterHuntExcluded (name: string) {
    const mhConfig = this.botConfig?.monsters?.monsterHuntExclude || []
    return mhConfig.includes(name)
  }

  async loop (): Promise<void> {
    const character = this.bot.character
    if (!character?.s?.monsterhunt) {
      const GetMonsterHuntTask = new GetMonsterHunt(this.bot, 99, this.bot.getServerIdentifier(), this.bot.getServerRegion())
      this.bot.queue.addTask(GetMonsterHuntTask)
      return
    }

    if (character.s?.monsterhunt?.c === 0) {
      const serverData = SNtoServerData(character.s.monsterhunt.sn)
      const FinishMonsterHuntTask = new FinishMonsterHunt(this.bot, 99, serverData.serverIdentifier, serverData.serverRegion)
      this.bot.queue.addTask(FinishMonsterHuntTask)
      return
    }

    if (character.s?.monsterhunt?.id && !this.monsterHuntExcluded(character.s.monsterhunt.id)) {
      const serverData = SNtoServerData(character.s.monsterhunt.sn)
      const MonsterHuntTask = new MonsterHunt(this.bot, 99, serverData.serverIdentifier, serverData.serverRegion)
      this.bot.queue.addTask(MonsterHuntTask)
    }
  }
}
