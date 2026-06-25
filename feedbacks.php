<?php
/**
 * receive_feedback.php
 * 接收来自 XL 客户端的反馈 POST 请求，保存为 JSON 文件。
 *
 * 用法：
 *   将该脚本放置在 Web 服务器目录下，确保该目录有写入权限。
 *   客户端 POST JSON 数据到此脚本 URL，需携带 Bearer token 认证。
 *   保存的文件位于同目录的 feedbacks/ 文件夹中，
 *   文件名格式为 feedback_YYYYmmdd_HHMMSS_5位随机数_4字节hex.json。
 *   同时会将反馈内容发送到指定的 QQ 群（OneBot 协议）。
 */

// 设置时区
date_default_timezone_set('Asia/Shanghai');

// ---------- CORS 头 ----------
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 预检请求直接返回
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------- 仅允许 POST ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Only POST method is allowed']));
}

// ---------- Bearer token 认证 ----------
$secret = 'yealqpxlclientfeedbacksecret'; // 共享密钥，生产环境应设置为强随机值并妥善保管
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = '';

if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
    $token = trim($matches[1]);
}

if ($secret !== '') {
    // 生产环境：必须匹配共享密钥
    if (!hash_equals($secret, $token)) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        die(json_encode(['error' => 'Unauthorized']));
    }
} else {
    // 开发/过渡环境：仅要求 token 非空
    if ($token === '') {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        die(json_encode(['error' => 'Authorization token required']));
    }
}

// ---------- 获取原始请求体 ----------
$rawInput = file_get_contents('php://input');

if (empty($rawInput)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Empty request body']));
}

// ---------- 解码 JSON ----------
$data = json_decode($rawInput, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]));
}

// ---------- 字段校验 ----------
// user_id：必须存在且为大于0的整数
if (!isset($data['user_id']) || !is_int($data['user_id']) || $data['user_id'] <= 0) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Missing or invalid field: user_id']));
}

// content：必须是非空字符串，限制最大长度 10000 字符
if (!isset($data['content']) || !is_string($data['content'])) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Missing or invalid field: content']));
}

$data['content'] = trim($data['content']);
if ($data['content'] === '') {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Field "content" must not be empty']));
}

const MAX_CONTENT_LENGTH = 10000;
if (mb_strlen($data['content']) > MAX_CONTENT_LENGTH) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Field "content" exceeds maximum length of ' . MAX_CONTENT_LENGTH]));
}

// ---------- 添加服务端元数据 ----------
$data['_received_at'] = date('Y-m-d H:i:s');
$data['_remote_ip']   = $_SERVER['HTTP_EO_FORWARD_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$data['_user_agent']  = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

// ---------- QQ 群通知（OneBot 协议）----------
const QQ_API_URL     = 'http://103.236.84.213:38840/send_group_msg';
const QQ_GROUP_ID    = 1039784218;
const QQ_API_KEY     = 'REDACTED_QQ_BOT_API_KEY';

/**
 * 发送 QQ 群机器人通知（OneBot 协议）
 * @param array $data 反馈数据，包含 user_id, content, _remote_ip, _received_at
 */
function send_qq_notification($data) {
    $text = sprintf(
        "XL Client 用户反馈\n用户ID: %d\n内容: %s\nIP: %s\n时间: %s",
        $data['user_id'],
        $data['content'],
        $data['_remote_ip'],
        $data['_received_at']
    );

    $payload = [
        'group_id' => QQ_GROUP_ID,
        'message' => $text
    ];

    $ch = curl_init(QQ_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . QQ_API_KEY
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
    curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("QQ 群通知发送失败: " . $error);
    }
}

// ---------- 确保存储目录存在 ----------
$saveDir = __DIR__ . '/feedbacks';
if (!is_dir($saveDir)) {
    if (!mkdir($saveDir, 0755, true)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        die(json_encode(['error' => 'Failed to create storage directory']));
    }
}

// ---------- 生成唯一文件名 ----------
// 格式：feedback_YYYYmmdd_HHMMSS_5位随机数_4字节hex.json
$filename = sprintf(
    'feedback_%s_%05d_%s.json',
    date('Ymd_His'),
    random_int(10000, 99999),
    bin2hex(random_bytes(4))
);
$filePath = $saveDir . '/' . $filename;

// ---------- 写入文件 ----------
$jsonString = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($filePath, $jsonString, LOCK_EX) === false) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(['error' => 'Failed to write file']));
}

    // ---------- 发送 QQ 群通知（非阻塞，忽略失败）----------
    send_qq_notification([
        'user_id' => $data['user_id'],
        'content' => $data['content'],
        '_remote_ip' => $data['_remote_ip'],
        '_received_at' => $data['_received_at']
    ]);

    // ---------- 成功响应 ----------
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok'      => true,
    'file'    => basename($filePath),
    'message' => 'Feedback saved successfully',
]);