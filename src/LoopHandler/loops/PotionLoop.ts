import Bot from '../../Bot/index.js'
import Loop from './Loop.js'

export default class PotionLoop extends Loop {
  constructor (bot: Bot) {
    super(bot)
    this.timeout = 3
  }

  async loop (): Promise<void> {
    if (!Object.keys(this.bot.character.c).length) {
      return await this.usePotionIfLow().catch((error) => {
        this.bot.logger.error(`${this.bot.name} failed to use potion - ${error}`)
      })
    }
  }

  private async usePotionIfLow (): Promise<void> {
    const character = this.bot.character
    const MPThreshold = character.max_mp < 1000 ? character.max_mp * 0.8 : character.max_mp - 500
    const HPThreshold = character.max_hp < 2000 ? character.max_hp * 0.9 : character.max_hp - 500

    const mpot0Loc = character.locateItem('mpot0', character.items)
    const mpot1Loc = character.locateItem('mpot1', character.items)
    const hpot0Loc = character.locateItem('hpot0', character.items)
    const hpot1Loc = character.locateItem('hpot1', character.items)

    const mpot = mpot1Loc !== undefined ? mpot1Loc : mpot0Loc
    const hpot = hpot1Loc !== undefined ? hpot1Loc : hpot0Loc

    if (character.mp === 0) {
      await this.useMP(mpot)
      return
    }

    if (character.hp < HPThreshold) {
      await this.useHP(hpot)
      await this.bot.wait(this.timeout)
    }

    if (character.mp < MPThreshold) await this.useMP(mpot)
  }

  private async useHP (hpot?: 'hpot0' | 'hpot1'): Promise<void> {
    if (hpot === undefined) {
      if (!this.bot.character.canUse('regen_hp')) return
      return await this.bot.character.regenHP()
    }

    return await this.bot.character.useHPPot(hpot).catch((error) => {
      this.bot.logger.error(`${this.bot.name} failed to use HPPot - ${error}`)
      return Promise.reject(new Error(error))
    })
  }

  private async useMP (mpot?: 'mpot0' | 'mpot1'): Promise<void> {
    if (mpot === undefined) {
      if (!this.bot.character.canUse('regen_mp')) return
      return await this.bot.character.regenMP()
    }

    return await this.bot.character.useMPPot(mpot).catch((error) => {
      this.bot.logger.error(`${this.bot.name} failed to use MPPot - ${error}`)
      return Promise.reject(new Error(error))
    })
  }
}
