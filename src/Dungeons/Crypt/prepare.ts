
export default function prepare (dungeon) {
  console.log('preparing')
  if (!dungeon.instanceKey && dungeon.tank.name === dungeon.bot.name) {
    // Retrieve and open instance
  }
  if (!dungeon.instanceKey && dungeon.tank.name !== dungeon.bot.name) {
    // If waiting at dungeon, return

    // Go outside dungeon and wait
  }

  if (!dungeon.instanceKey) return

  if (dungeon.bot.character.map !== 'crypt') {
    // Enter crypt
  }

  if (!dungeon.bot.party.partyInSameMap('crypt')) {
    // Return to rally point
  }
}
