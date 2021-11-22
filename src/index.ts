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
  admin: '/admin',
  buy: '/buy',
  blocked: '/blocked'
}

const actions : any = {
  login: '/login',
  logout: '/logout'
}

app.use(
  auth({
    idpLogout: true,
    authRequired: false, // only require auth on specific endpoints
    issuerBaseURL:'https://auth.stagetokensoft.com',
    // issuerBaseURL: 'http://localhost:3000',
    baseURL: 'http://localhost:3001',
    clientID,
    secret,
    authorizationParams: {
      scope: 'openid profile email verification' //custom 'verification' scope
    },
    routes: {
      postLogoutRedirect: 'http://localhost:3001/'
    }
  })
)

const name = (req : any) => req.oidc.user ? req.oidc.user.sub : 'anon'

// I call this rendering library FailWinds
const links = Object.keys(routes).map((k : string) => `<a href="${routes[k]}">${k}</a>`).join('<br>')
const buttons = Object.keys(actions).map((k : string) => `<a href="${actions[k]}"><button>${k}</button></a>`).join('<br>')
const navbar = links.concat('<br>').concat(buttons).concat('<br>')

app.get(
  routes.home,
  (req : any, res) => {res.send(`${navbar}Home - no auth required - welcome ${name(req)}`)}
)

// any logged in user
app.get(
  routes.profile,
  requiresAuth(),
  (req : any, res) => res.send(`${navbar}Profile (must be authenticated) welcome ${req.oidc.user.sub}`)
)

// must have specific claims
app.get(
  routes.admin,
  claimIncludes('roles', 'admin'),
  (req : any, res) => res.send(`${navbar}Admin (must be authenticated and admin) welcome ${req.oidc.user.sub}`)
)

// using our custom oidc claims: must have verified US address to participate in a sale
app.get(
  routes.buy,
  (req: any, res, next) => {
    const country = req.oidc.country
    const verified = req.oidc['https://tokensoft.io/identity_verified']
    // return new Error(JSON.stringify(req.oidc))
    // only continue if user qualifies
    return country == 'US' && verified ? next() : res.redirect(routes.blocked)
  },
  (req : any, res) => res.send(`${navbar}Sale (must be authenticated and a verified US user) you are approve to purchase X coins ${req.oidc.user.sub}`)
)

// a blocked user
app.get(
  routes.blocked,
  (req : any, res) => res.send(`${navbar}Blocked! ${req.oidc.user.sub} - do you even KYC?`)
)

app.get(actions.login, (_, res: any) => res.oidc.login({ returnTo: routes.admin }))

app.get(actions.logout, (req, res : any) => {res.oidc.logout(); alert(`you are logged out ${name(req)}`)} )
app.get('/custom-logout', (req, res) => res.send(`${navbar}Goodbye ${name(req)}`))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
