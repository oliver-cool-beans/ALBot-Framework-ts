import Bot from '../../../Bot/index.js'
import { isOnSameServer } from '../../../helpers/index.js'

export async function support (bot: Bot, targetData) {
  const { character } = bot

  if (targetData && targetData.target !== character.id && character.canUse('absorb')) {
    if (bot.party.findMemberById(targetData.target)) {
      return character.absorbSins(targetData.target)
    }
  }

  const attackingParty = [...character.entities.values()].filter((entity) => {
    return entity.target && bot.party.findMemberById(entity.target) && entity.target !== bot.character.id
  })

  if (attackingParty.length && character.canUse('absorb')) {
    await character.absorbSins(attackingParty[0].target)
  }

  const lowHealthPartyMembers = bot.party.members.filter((member) => {
    return member.isLowHp(60) &&
    member.character.map === character.map &&
    isOnSameServer(bot, member)
  })

  if (bot.isLowHp(40) && character.canUse('partyheal')) {
    return character.partyHeal()
  }

  if (lowHealthPartyMembers.length > 1 && character.canUse('partyheal')) {
    return character.partyHeal()
  }

  const attackingMe = bot.attackingMe()

  if (!attackingMe.length && character.hp < character.max_hp && character.canUse('heal') && !targetData?.target) {
    return bot.character.healSkill(character.id)
  }
}
