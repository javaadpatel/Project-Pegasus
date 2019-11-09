const Connect = window.uportconnect;
const uportConnect = new Connect('Pegasus Investments (Ropsten)', {
    network: "ropsten",
    profileImage: {"/": "/ipfs/QmWzUd2G5rU8Sfwt7if5Cb5TzeCKvzmRbCDkHww4WjvzHq"},
    bannerImage: {"/": "/ipfs/QmVKW2MqS1LmBGsBc7ww387SdkJHnuegLoRwqLJ8XtsZtU"},
    description: "Crowdfunding investment platform which allows investors to quickly invest and get returns for their investments."
  })

export default uportConnect;

/*UPort Specs: https://github.com/uport-project/specs */