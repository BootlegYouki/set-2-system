

module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'static/icon', // Electron Forge automatically adds .ico for Windows
    extraResource: ['./.env']
  },
  rebuildConfig: {
    onlyModules: [],
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'static/icon.ico'
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
