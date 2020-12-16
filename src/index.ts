import { auth, requiresAuth, claimIncludes } from 'express-openid-connect'
import express from 'express'

const app = express()
const port = 3001

// Note that client id and secret must match oidc-server config
const clientID = 'zELcpfANLqY7Oqas'
const secret = 'TQV5U29k1gHibH5bx1layBo0OSAvAbRT3UYW3EWrSYBB5swxjVfWUa1BS8lqzxG/0v9wruMcrGadany3'

const routes : any = {
  home: '/',
  profile: '/profile',
  admin: '/admin'
}

const actions : any = {
  login: '/login',
  logout: '/logout'
}

app.use(
  auth({
    idpLogout: true,
    // only require auth on specific endpoints
    authRequired: false,
    // routes: {
    //   login: false,
    //   postLogoutRedirect: '/custom-logout'
    // },
    issuerBaseURL: 'http://localhost:3000',
    baseURL: 'http://localhost:3001',
    clientID,
    secret
  })
)

const name = (req : any) => req.oidc.user ? req.oidc.user.sub : 'anon'

// I call this rendering library FailWinds
const links = Object.keys(routes).map((k : string) => `<a href="${routes[k]}">${k}</a>`).join('<br>')
const buttons = Object.keys(actions).map((k : string) => `<a href="${actions[k]}"><button>${k}</button></a>`).join('<br>')
const navbar = links.concat('<br>').concat(buttons).concat('<br>')

app.get(routes.home, (req : any, res) => {
  res.send(`${navbar}Home - no auth required - welcome ${name(req)}`)
})

// any logged in user
app.get(routes.profile, requiresAuth(), (req : any, res) => res.send(`${navbar}Admin (must be authenticated) welcome ${req.oidc.user.sub}`))

// must have specific claims
app.get(routes.admin, claimIncludes('roles', 'admin'), (req : any, res) => res.send(`${navbar}Admin - top secret, login required, welcome ${req.oidc.user.sub}`))

app.get(actions.login, (_, res: any) => res.oidc.login({ returnTo: routes.admin }))

app.get(actions.logout, (req, res : any) => {res.oidc.logout(); alert(`you are logged out ${name(req)}`)} )
app.get('/custom-logout', (req, res) => res.send(`${navbar}Goodbye ${name(req)}`))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
