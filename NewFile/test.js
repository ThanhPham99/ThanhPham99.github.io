const wait = () => new Promise((resolve, reject) => {
    setTimeout(resolve, 1000)
    })
    wait().then(() => {
    console.log('I promised to run after 1s')
    return wait()
    })
    .then(() => console.log('I promised to run after 2s'))