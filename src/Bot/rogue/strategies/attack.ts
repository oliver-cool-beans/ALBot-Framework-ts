import Bot from '../../index.js'

export async function attack (bot: Bot, targetData) {
  const { character } = bot
  if (!targetData?.id) return

  console.log(character.canUse('mentalburst'), targetData.hp <= character.attack * 0.6)
  if (character.canUse('mentalburst') && targetData.hp <= character.attack * 0.6 && bot.isLowMp(70)) {
    await character.mentalBurst(targetData.id).catch((error) => {
      bot.logger.error(`${bot.name} failed to mentalburst - ${error}`)
    })
  }

  if (character.canUse('attack')) {
    await character.basicAttack(targetData.id).catch((error) => {
      bot.logger.error(`${bot.name} failed to attack - ${error}`)
    })
  }

  if (character.canUse('quickstab')) {
    await character.quickStab(targetData.id).catch((error) => {
      bot.logger.error(`${bot.name} failed to quickstab - ${error}`)
    })
  }
}
