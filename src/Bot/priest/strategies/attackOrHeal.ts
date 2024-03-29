import Bot from '../../../Bot/index.js'
import { isOnSameServer } from '../../../helpers/index.js'

export async function attackOrHeal (bot: Bot, targetData) {
  const { character } = bot
  if (character.canUse('heal')) {
    if (bot.isLowHp(60)) {
      return bot.character.healSkill(character.id)
    }

    const lowHealthPartyMembers = bot.party.members.filter((member) => {
      return member.isLowHp(60) &&
      bot.AL.Tools.distance(character, member.character) < character.range &&
      isOnSameServer(bot, member)
    })

    if (lowHealthPartyMembers.length) {
      return await bot.character.healSkill(lowHealthPartyMembers[0].character.id).catch((error) => {
        bot.logger.error(`${bot.name} failed to heal - ${error}`)
      })
    }
  }

  if (character.canUse('attack') && targetData) {
    await character.basicAttack(targetData.id).catch(() => {})
  }
}
