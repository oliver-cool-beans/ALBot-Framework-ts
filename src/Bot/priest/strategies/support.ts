import Bot from '../../../Bot/index.js'

export async function support (bot: Bot, targetData) {
  const { character } = bot

  if (targetData && targetData.target !== character.id && character.canUse('absorb')) {
    if (bot.party.findMemberById(targetData.target)) {
      return character.absorbSins(targetData.target)
    }
  }

  const lowHealthPartyMembers = bot.party.members.filter((member) => {
    return member.isLowHp(60) &&
    member.character.map === character.map
  })

  if (bot.isLowHp(40) && character.canUse('partyheal')) {
    return character.partyHeal()
  }

  if (lowHealthPartyMembers.length > 1 && character.canUse('partyheal')) {
    return character.partyHeal()
  }
}
