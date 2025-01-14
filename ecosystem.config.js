module.exports = {
    apps: [{
      name: "ascedual",
      script: "npm",
      args: "run preview",
      env: {
        NODE_ENV: "production"
      }
    }]
  }