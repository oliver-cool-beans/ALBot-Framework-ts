import Bot from '../../../Bot/index.js'

export async function attackOrHeal (bot: Bot, targetData) {
  const { character } = bot

  if (character.canUse('heal')) {
    if (bot.isLowHp(60)) {
      return await bot.character.heal(character.id)
    }
    const lowHealthPartyMembers = bot.party.members.filter((member) => {
      return member.isLowHp(60)
    })
    if (lowHealthPartyMembers.length) {
      return await bot.character.heal(lowHealthPartyMembers[0])
    }
  }

  if (character.canUse('attack') && targetData) {
    await character.basicAttack(targetData.id).catch((error) => {
      bot.logger.error(`${bot.name} failed to attack - ${error}`)
    })
  }
}
