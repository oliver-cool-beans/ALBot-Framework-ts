import Bot from '../../../Bot/index.js'

export async function support (bot: Bot, targetData) {
  const { character } = bot

  if (targetData && targetData.target !== character.id && character.canUse('absorbSins')) {
    return character.absorbSins()
  }

  const lowHealthPartyMembers = bot.party.members.filter((member) => {
    return member.isLowHp(60) &&
    member.character.map === character.map
  })

  if (lowHealthPartyMembers.length > 1 && character.canUse('partyHeal')) {
    return character.partyHeal()
  }
}
