Sample of using LogTail with Worker Trace Events Logpush

All Credit to https://gist.github.com/stefandanaita/88c4d8b187400d5b07524cd0a12843b2 for most of the code.

# How To Use

## Clone Repo


## Add Authorization Secret
 wrangler secret put AuthSecret
 > Enter the full Authorization header including "Bearer", ex "Bearer WrzhWDi8KxgbV6VuRmskzH22"

 ## Add Logpush Secret
 wrangler secret put LogPushSecret
 > The value can be whatever you want, just keep it for later.

## Deploy
wrangler publish

## Create LogPush Job
Example:
```
curl -s -X POST 'https://api.cloudflare.com/client/v4/accounts/{AccountID}/logpush/jobs' -X POST -d '
{
  "name": "logpush-to-worker",
  "destination_conf": "https://{YourWorkerName}.{YourSubdomain}.workers.dev/?header_Authorization={LogPushSecret}",
  "dataset": "workers_trace_events",
  "enabled": true
}' -H "X-Auth-Email: ....." -H "X-Auth-Key: ...."
```

Insert your Account ID (find in Workers Tab on Right side), your worker domain, your logpush secret, and CF API Auth Details (either Global API Key or API Token)


CF will send a test event. If it works, then congrats you're done. Check in LogTail for your events and take a nap.
