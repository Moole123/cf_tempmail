import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, SendEmailParams, ParsedEmail } from './types';
import { 
  createMailbox, 
  getMailbox, 
  deleteMailbox, 
  getEmails, 
  getEmail, 
  deleteEmail,
  getAttachments,
  getAttachment
} from './database';
import { generateRandomAddress, isValidEmailAddress, sendEmail } from './utils';
import { parseRawEmail } from './email-builder';

// 创建 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// 添加 CORS 中间件
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// 健康检查端点
app.get('/', (c) => {
  return c.json({ status: 'ok', message: '临时邮箱系统API正常运行' });
});

// 发送邮件API，暂时不用
app.post('/api/send-email', async (c) => {
  try {
    const body = await c.req.json() as SendEmailParams;
    
    // 验证必要参数
    if (!body.fromAddress || typeof body.fromAddress !== 'string') {
      return c.json({ success: false, error: '发件人地址不能为空' }, 400);
    }
    
    if (!body.toAddress || typeof body.toAddress !== 'string') {
      return c.json({ success: false, error: '收件人地址不能为空' }, 400);
    }
    
    if (!isValidEmailAddress(body.toAddress)) {
      return c.json({ success: false, error: '收件人邮箱地址格式无效' }, 400);
    }
    
    if (!body.subject || typeof body.subject !== 'string') {
      return c.json({ success: false, error: '邮件主题不能为空' }, 400);
    }
    
    if (!body.textContent && !body.htmlContent) {
      return c.json({ success: false, error: '邮件内容不能为空' }, 400);
    }
    
    // // 查找发件人邮箱是否存在
    // const mailbox = await getMailbox(c.env.DB, body.fromAddress);
    
    // if (!mailbox) {
    //   return c.json({ success: false, error: '发件人邮箱不存在' }, 404);
    // }
    
    // 发送邮件
    const result = await sendEmail(
      body.fromAddress,
      body.toAddress,
      body.toName || '',
      body.subject,
      body.textContent || '',
      body.htmlContent || ''
    );
    
    if (result.success) {
      return c.json({ 
        success: true, 
        message: '邮件发送成功'
      });
    } else {
      return c.json({ 
        success: false, 
        error: result.error || '邮件发送失败'
      }, 500);
    }
  } catch (error) {
    console.error('发送邮件失败:', error);
    return c.json({ 
      success: false, 
      error: '发送邮件失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 接收原始邮件并解析，用于测试解析邮件功能
app.post('/api/parse-email', async (c) => {
  try {
    console.log('接收到解析邮件请求');
    
    // 获取请求体中的原始邮件内容
    const body = await c.req.text();
    
    if (!body) {
      console.log('未提供邮件内容');
      return c.json({ success: false, error: '未提供邮件内容' }, 400);
    }
    
    console.log(`接收到邮件内容，长度: ${body.length} 字节`);
    
    // 将文本内容转换为ArrayBuffer
    const encoder = new TextEncoder();
    const rawEmail = encoder.encode(body).buffer;
    
    // 使用PostalMime解析邮件
    const parsedEmail = await parseRawEmail(rawEmail) as ParsedEmail;
    
    console.log('邮件解析成功:', {
      subject: parsedEmail.subject,
      from: parsedEmail.from,
      to: parsedEmail.to?.length || 0,
      hasText: !!parsedEmail.text,
      hasHtml: !!parsedEmail.html,
      attachments: parsedEmail.attachments?.length || 0
    });
    
    // 返回解析结果
    return c.json({ 
      success: true, 
      email: {
        subject: parsedEmail.subject,
        from: parsedEmail.from,
        to: parsedEmail.to,
        text: parsedEmail.text,
        html: parsedEmail.html,
        hasAttachments: !!parsedEmail.attachments?.length,
        attachmentsCount: parsedEmail.attachments?.length || 0
      }
    });
  } catch (error) {
    console.error('解析邮件失败:', error);
    return c.json({ 
      success: false, 
      error: '解析邮件失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 创建邮箱
app.post('/api/mailboxes', async (c) => {
  try {
    const body = await c.req.json();
    
    // 验证参数
    if (body.address && typeof body.address !== 'string') {
      return c.json({ success: false, error: '无效的邮箱地址' }, 400);
    }
    
    const expiresInHours = 24; // 固定24小时有效期
    
    // 获取客户端IP
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    
    // 生成或使用提供的地址
    const address = body.address || generateRandomAddress();
    
    // 检查邮箱是否已存在
    const existingMailbox = await getMailbox(c.env.DB, address);
    if (existingMailbox) {
      return c.json({ success: false, error: '邮箱地址已存在' }, 400);
    }
    
    // 创建邮箱
    const mailbox = await createMailbox(c.env.DB, {
      address,
      expiresInHours,
      ipAddress: ip,
    });
    
    return c.json({ success: true, mailbox });
  } catch (error) {
    console.error('创建邮箱失败:', error);
    return c.json({ 
      success: false, 
      error: '创建邮箱失败',
      message: error instanceof Error ? error.message : String(error)
    }, 400);
  }
});

// 获取邮箱信息
app.get('/api/mailboxes/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const mailbox = await getMailbox(c.env.DB, address);
    
    if (!mailbox) {
      return c.json({ success: false, error: '邮箱不存在' }, 404);
    }
    
    return c.json({ success: true, mailbox });
  } catch (error) {
    console.error('获取邮箱失败:', error);
    return c.json({ 
      success: false, 
      error: '获取邮箱失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 删除邮箱
app.delete('/api/mailboxes/:address', async (c) => {
  try {
    const address = c.req.param('address');
    await deleteMailbox(c.env.DB, address);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('删除邮箱失败:', error);
    return c.json({ 
      success: false, 
      error: '删除邮箱失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取邮件列表
app.get('/api/mailboxes/:address/emails', async (c) => {
  try {
    const address = c.req.param('address');
    const mailbox = await getMailbox(c.env.DB, address);
    
    if (!mailbox) {
      return c.json({ success: false, error: '邮箱不存在' }, 404);
    }
    
    const emails = await getEmails(c.env.DB, mailbox.id);
    
    return c.json({ success: true, emails });
  } catch (error) {
    console.error('获取邮件列表失败:', error);
    return c.json({ 
      success: false, 
      error: '获取邮件列表失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取邮件详情
app.get('/api/emails/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const email = await getEmail(c.env.DB, id);
    
    if (!email) {
      return c.json({ success: false, error: '邮件不存在' }, 404);
    }
    
    return c.json({ success: true, email });
  } catch (error) {
    console.error('获取邮件详情失败:', error);
    return c.json({ 
      success: false, 
      error: '获取邮件详情失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取邮件的附件列表
app.get('/api/emails/:id/attachments', async (c) => {
  try {
    const id = c.req.param('id');
    
    // 检查邮件是否存在
    const email = await getEmail(c.env.DB, id);
    if (!email) {
      return c.json({ success: false, error: '邮件不存在' }, 404);
    }
    
    // 获取附件列表
    const attachments = await getAttachments(c.env.DB, id);
    
    return c.json({ success: true, attachments });
  } catch (error) {
    console.error('获取附件列表失败:', error);
    return c.json({ 
      success: false, 
      error: '获取附件列表失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 获取附件详情
app.get('/api/attachments/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const attachment = await getAttachment(c.env.DB, id);
    
    if (!attachment) {
      return c.json({ success: false, error: '附件不存在' }, 404);
    }
    
    // 检查是否需要直接返回附件内容
    const download = c.req.query('download') === 'true';
    
    if (download) {
      // 将Base64内容转换为二进制
      const binaryContent = atob(attachment.content);
      const bytes = new Uint8Array(binaryContent.length);
      for (let i = 0; i < binaryContent.length; i++) {
        bytes[i] = binaryContent.charCodeAt(i);
      }
      
      // 设置响应头
      c.header('Content-Type', attachment.mimeType);
      c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
      
      return c.body(bytes);
    }
    
    // 返回附件信息（不包含内容，避免响应过大）
    return c.json({ 
      success: true, 
      attachment: {
        id: attachment.id,
        emailId: attachment.emailId,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt,
        isLarge: attachment.isLarge,
        chunksCount: attachment.chunksCount
      }
    });
  } catch (error) {
    console.error('获取附件详情失败:', error);
    return c.json({ 
      success: false, 
      error: '获取附件详情失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 删除邮件
app.delete('/api/emails/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await deleteEmail(c.env.DB, id);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('删除邮件失败:', error);
    return c.json({ 
      success: false, 
      error: '删除邮件失败',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 调试端点
app.get('/api/debug/db', (c) => {
  return c.json({
    dbDefined: !!c.env.DB,
    dbType: typeof c.env.DB,
    dbMethods: c.env.DB ? Object.keys(c.env.DB) : []
  });
});

export default app;