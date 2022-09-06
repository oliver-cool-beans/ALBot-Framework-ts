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
    return mhConfig.includes(name) || this.bot.character.level < 60
  }

  findCharactersWithMH (): Bot | undefined {
    return this.bot.party.members.find((member) => {
      return member.queue.findTaskByName('MonsterHunt') &&
      member.character?.s?.monsterhunt?.id &&
      !this.monsterHuntExcluded(member.character.s.monsterhunt.id)
    })
  }

  hasValidMonsterHunt (bot: Bot) : boolean {
    return bot.character.s?.monsterhunt?.id && !this.monsterHuntExcluded(bot.character.s.monsterhunt.id)
  }

  async loop (): Promise<void> {
    const character = this.bot.character
    if (!character?.s?.monsterhunt) {
      const GetMonsterHuntTask = new GetMonsterHunt(this.bot, 99, this.bot.defaultRegionIdentifier, this.bot.defaultRegionName)
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
      return
    }

    const botWithMonsterHunt = this.findCharactersWithMH()
    if (!this.hasValidMonsterHunt(this.bot) && botWithMonsterHunt && this.hasValidMonsterHunt(botWithMonsterHunt) && !this.bot.queue.findTaskByName('MonsterHunt')) {
      const serverData = SNtoServerData(botWithMonsterHunt.character.s.monsterhunt.sn)
      const args = { proxyMonsterHuntMember: botWithMonsterHunt.name }
      const ProxyMonsterHuntTask = new MonsterHunt(this.bot, 99, serverData.serverIdentifier, serverData.serverRegion, [], [], args)
      this.bot.queue.addTask(ProxyMonsterHuntTask)
    }
  }
}
