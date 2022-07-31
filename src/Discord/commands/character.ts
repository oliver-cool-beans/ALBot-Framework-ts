import { SlashCommandBuilder } from '@discordjs/builders'

export function create () {
  console.log('creating char commands')
  try {
    return new SlashCommandBuilder().setName('character').setDescription('Commands for a specific character')
      .addSubcommand((subcommand) => subcommand.setName('login').setDescription('Log the character in')
        .addStringOption(option => option.setName('name').setDescription('Character name').setRequired(true)))
      .addSubcommand((subcommand) => subcommand.setName('logout').setDescription('Log the character out')
        .addStringOption(option => option.setName('name').setDescription('Character name').setRequired(true)))
      .addSubcommand((subcommand) => {
        return subcommand.setName('monster').setDescription('Switch the character default monster')
          .addStringOption(option => option.setName('name').setDescription('Character name').setRequired(true))
          .addStringOption(option => option.setName('monster').setDescription('Monster name').setRequired(true))
      })
      .toJSON()
  } catch (error) {
    console.log(error)
  }
}

export async function interact (interaction, characters, AL) {
  const subcommand = interaction.options.getSubcommand(interaction)
  if (subcommand === 'login') return login(interaction, characters, AL)
  if (subcommand === 'logout') return logout(interaction, characters, AL)
  if (subcommand === 'monster') return setMonster(interaction, characters, AL)
}

async function login (interaction, characters, AL) {
  const characterName = interaction.options.getString('name')

  // interaction.editReply({ ephemeral: true, content: `Logging in character  ${characterName}` })

  const character = characters.find((char) => char.name.toLowerCase() === characterName)
  if (!character) return
  character.party.addMember(character.name)
  await character.start(AL)
  await character.run()
}

async function logout (interaction, characters, AL) {
  const characterName = interaction.options.getString('name')
  interaction.editReply({ ephemeral: true, content: `Logging out character  ${characterName}` })

  const character = characters.find((char) => char.name.toLowerCase() === characterName)

  if (!character) return
  character.disconnect()
}

async function setMonster (interaction, characters, AL) {
  const characterName = interaction.options.getString('name')
  const monsterName = interaction.options.getString('monster')
  interaction.editReply({ ephemeral: true, content: `Character ${characterName} setting monster ${monsterName}` })
  const character = characters.find((char) => char.name.toLowerCase() === characterName)
  if (!character) return
  character.monster = monsterName
}
