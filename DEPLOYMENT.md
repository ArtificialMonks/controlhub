# Communitee Control Hub - Deployment Guide

## 🚀 Production Deployment Setup

### **Environment Variables for Vercel Dashboard**

Configure the following environment variables in your Vercel project dashboard:

#### **Required Supabase Configuration**
```
NEXT_PUBLIC_SUPABASE_URL = https://trphfbzhurabdmgqimwj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycGhmYnpodXJhYmRtZ3FpbXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDE4MjEsImV4cCI6MjA2OTUxNzgyMX0.RpT9zWTEL50xXnoTizmbaA6V-pIzWzf47iRxk5EfPDw
SUPABASE_SERVICE_ROLE_KEY = [Get from Supabase Dashboard > Settings > API]
```

#### **Required Authentication Configuration**
```
NEXTAUTH_SECRET = [Generate: openssl rand -base64 32]
```

#### **Required n8n Integration**
```
N8N_API_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MjExYTJjZi1lYTJjLTQ0Y2QtOGMyNS0xNDRjMDA4MTI1ODciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzNzk1MjQ1fQ.WAhjBxjE6lTMOdldQr0a01zth_B9iYJwm4VBoomyVnU
N8N_WEBHOOK_SECRET = [Generate: openssl rand -hex 32]
N8N_BASE_URL = https://n8n.artificialmonks.com
```

#### **Required Security Configuration**
```
ENCRYPTION_KEY = [Generate: openssl rand -base64 32]
CORS_ORIGINS = https://controlhub.artificialmonks.com,https://n8n.artificialmonks.com
```

#### **Optional Monitoring Configuration**
```
ENABLE_ANALYTICS = true
ENABLE_ERROR_TRACKING = true
LOG_LEVEL = info
FEATURE_TELEMETRY = true
FEATURE_ADVANCED_ANALYTICS = true
```

### **Deployment Steps**

1. **Create Vercel Project**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from project root
   vercel --prod
   ```

2. **Configure Custom Domain**
   - Add domain: `controlhub.artificialmonks.com`
   - Configure DNS records as instructed by Vercel

3. **Database Setup**
   - Run Supabase migrations in the Supabase dashboard
   - Enable Row Level Security on all tables
   - Test database connectivity

4. **Post-Deployment Verification**
   - Test authentication flow
   - Verify API endpoints
   - Test n8n webhook integration
   - Check monitoring and logging

### **Security Checklist**

- ✅ All environment variables configured
- ✅ HTTPS enforced (automatic with Vercel)
- ✅ Security headers configured in vercel.json
- ✅ CORS properly configured for API routes
- ✅ Row Level Security enabled in Supabase
- ✅ Webhook secrets properly configured

### **Monitoring Setup**

1. **Vercel Analytics** - Automatically enabled
2. **Error Tracking** - Configure LOG_LEVEL and ENABLE_ERROR_TRACKING
3. **Performance Monitoring** - Built into Next.js and Vercel
4. **Custom Metrics** - Available through the monitoring system

### **Troubleshooting**

#### **Build Issues**
- Ensure all dependencies are in package.json
- Check TypeScript compilation locally: `npm run build`
- Verify environment variables are set

#### **Runtime Issues**
- Check Vercel function logs
- Verify Supabase connection
- Test API endpoints individually

#### **Database Issues**
- Verify RLS policies are correct
- Check Supabase service role key
- Test database queries in Supabase dashboard

### **Rollback Procedure**

1. **Immediate Rollback**
   ```bash
   vercel rollback [deployment-url]
   ```

2. **Environment Variable Rollback**
   - Revert environment variables in Vercel dashboard
   - Redeploy if necessary

3. **Database Rollback**
   - Use Supabase point-in-time recovery if needed
   - Restore from backup if available

### **Performance Optimization**

- **Edge Functions**: API routes automatically deployed to edge
- **Static Generation**: Pages pre-rendered where possible
- **Image Optimization**: Next.js Image component used
- **Caching**: Proper cache headers configured
- **Bundle Analysis**: Use `npm run build` to analyze bundle size

### **Security Best Practices**

- **Environment Variables**: Never commit .env.local to version control
- **API Keys**: Rotate keys regularly
- **HTTPS**: Always use HTTPS in production
- **Headers**: Security headers configured in vercel.json
- **CORS**: Restrictive CORS policy configured
- **Input Validation**: All API inputs validated and sanitized
