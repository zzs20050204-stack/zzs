package com.example.react.controller;

import com.example.react.config.DeepSeekConfig;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final DeepSeekConfig deepSeekConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public AiController(DeepSeekConfig deepSeekConfig) {
        this.deepSeekConfig = deepSeekConfig;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        System.out.println("######## AiController created ########");
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> reqBody) {
        List<Map<String, Object>> messages = buildMessages(reqBody);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(deepSeekConfig.getKey());

        Map<String, Object> body = new HashMap<>();
        body.put("model", deepSeekConfig.getModel());
        body.put("messages", messages);
        body.put("stream", false);
        body.put("temperature", 0.7);
        body.put("max_tokens", 1024);

        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        String respStr = restTemplate.postForObject(deepSeekConfig.getUrl(), entity, String.class);

        try {
            JsonNode jsonNode = objectMapper.readTree(respStr);
            String answer = jsonNode.at("/choices/0/message/content").asText();
            Map<String, String> result = new HashMap<>();
            result.put("answer", answer);
            return ResponseEntity.ok(result);
        } catch (JsonProcessingException e) {
            Map<String, String> errMap = new HashMap<>();
            errMap.put("error", "AI response parsing failed");
            return ResponseEntity.status(500).body(errMap);
        }
    }

    @PostMapping("/chat/stream")
    public SseEmitter chatStream(@RequestBody Map<String, Object> reqBody) {
        SseEmitter emitter = new SseEmitter(120000L);

        List<Map<String, Object>> messages = buildMessages(reqBody);

        executor.execute(() -> {
            try {
                SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
                factory.setBufferRequestBody(false);
                RestTemplate streamTemplate = new RestTemplate(factory);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(deepSeekConfig.getKey());

                Map<String, Object> body = new HashMap<>();
                body.put("model", deepSeekConfig.getModel());
                body.put("messages", messages);
                body.put("stream", true);
                body.put("temperature", 0.7);
                body.put("max_tokens", 1024);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

                streamTemplate.execute(
                    deepSeekConfig.getUrl(),
                    HttpMethod.POST,
                    request -> {
                        request.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                        request.getHeaders().setBearerAuth(deepSeekConfig.getKey());
                        objectMapper.writeValue(request.getBody(), body);
                    },
                    response -> {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(response.getBody()));
                        String line;
                        while ((line = reader.readLine()) != null) {
                            if (!line.startsWith("data: ")) continue;
                            String data = line.substring(6).trim();
                            if ("[DONE]".equals(data)) break;
                            try {
                                JsonNode node = objectMapper.readTree(data);
                                JsonNode delta = node.at("/choices/0/delta/content");
                                if (!delta.isMissingNode()) {
                                    String content = delta.asText();
                                    if (content != null && !content.isEmpty()) {
                                        emitter.send(SseEmitter.event().name("token").data(content));
                                    }
                                }
                            } catch (Exception ignored) {}
                        }
                        emitter.send(SseEmitter.event().name("done").data(""));
                        emitter.complete();
                        return null;
                    }
                );
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                    emitter.complete();
                } catch (Exception ex) {}
            }
        });

        emitter.onCompletion(() -> {});
        emitter.onTimeout(() -> {});

        return emitter;
    }

    private List<Map<String, Object>> buildMessages(Map<String, Object> reqBody) {
        String systemPrompt = buildSystemPrompt();
        List<?> rawMessages = (List<?>) reqBody.get("messages");

        List<Map<String, Object>> messages = new ArrayList<>();
        Map<String, Object> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        for (Object item : rawMessages) {
            @SuppressWarnings("unchecked")
            Map<String, Object> msg = (Map<String, Object>) item;
            messages.add(msg);
        }
        return messages;
    }

    private String buildSystemPrompt() {
        return "你是「智慧社区管理系统」的专业AI客服助手，你的名字叫「小智」。\n" +
                "你的服务对象是小区居民和物业管理员。你必须严格围绕本系统的实际功能回答，并且功能名称必须与系统导航栏一致。\n" +
                "\n" +
                "=== 系统导航菜单 ===\n" +
                "居民端导航：首页、商品、在线报修、公告、物业缴费、访客预约、建议反馈、AI助手、我的\n" +
                "管理员端导航：首页、商品、在线报修、订单管理、住户管理、公告管理、用户管理、访客审核、缴费单管理、建议管理、AI助手、我的\n" +
                "居民端「我的」页面可进入：数据看板\n" +
                "\n" +
                "=== 各功能详细说明（必须用导航栏中的名称！）===\n" +
                "\n" +
                "【在线报修】\n" +
                "- 居民提交报修申请，填写：联系电话、居住地址、报修问题描述、可上传现场照片\n" +
                "- 状态：「待处理」和「已处理」\n" +
                "- 管理员可查看所有报修单并标记为「已处理」\n" +
                "- 回答模板：在导航栏点击「在线报修」，然后点击「我要报修」按钮，填写联系电话、地址和问题描述，上传照片后提交。管理员处理后会更新状态。\n" +
                "\n" +
                "【物业缴费】\n" +
                "- 费用类型：物业费、水费、电费、停车费\n" +
                "- 状态：「待缴费」和「已缴费」\n" +
                "- 居民只能看到自己的账单，点击「立即缴费」完成支付\n" +
                "- 管理员通过「缴费单管理」发布账单、查看缴费统计\n" +
                "- 回答模板：在导航栏点击「物业缴费」，查看待缴费账单，点击对应账单的「立即缴费」按钮即可完成支付。\n" +
                "\n" +
                "【访客预约】\n" +
                "- 居民提交访客预约，填写：访客姓名、手机号、来访事由、到访时间段\n" +
                "- 状态：「待审核」→「已通过」或「已驳回」\n" +
                "- 审核通过后生成访客二维码通行证\n" +
                "- 管理员通过「访客审核」审核预约（通过或驳回，驳回需填原因）\n" +
                "- 回答模板：在导航栏点击「访客预约」，点击「新增预约」填写访客信息后提交。管理员审核通过后会生成二维码，访客凭码在有效时间内进入小区。\n" +
                "\n" +
                "【商品】\n" +
                "- 居民可浏览、搜索商品（名称、价格、描述、图片），加入购物车或直接购买\n" +
                "- 购物车支持增减数量、选择商品和收货地址、批量结算\n" +
                "- 订单状态：「待支付」→「已支付」→「已发货」→「已完成」；退款：「申请退款中」→「已退款」\n" +
                "- 管理员可发布、编辑、删除商品；通过「订单管理」处理发货和退款\n" +
                "- 回答模板：在导航栏点击「商品」浏览商品，点击「加入购物车」或「立即购买」。然后在导航栏点击「我的」，在购物车中选择收货地址后结算，在订单中跟踪物流。\n" +
                "\n" +
                "【建议反馈】\n" +
                "- 居民可提交建议（500字以内）\n" +
                "- 状态：「待处理」和「已处理」\n" +
                "- 管理员通过「建议管理」查看并处理反馈\n" +
                "- 回答模板：在导航栏点击「建议反馈」，输入建议内容后提交。管理员处理后会更新状态。\n" +
                "\n" +
                "【公告】\n" +
                "- 居民端叫「公告」，在导航栏和首页可查看\n" +
                "- 管理员端叫「公告管理」，可发布和管理公告\n" +
                "- 回答模板：在首页或导航栏点击「公告」即可查看社区公告列表，点击公告可展开查看详情。\n" +
                "\n" +
                "【我的】\n" +
                "- 查看和修改个人资料（头像、手机号、邮箱）\n" +
                "- 管理收货地址（新增、编辑、删除、设置默认）\n" +
                "- 查看购物车和订单（支付、确认收货、申请退款）\n" +
                "- 查看报修记录、缴费记录、建议记录\n" +
                "- 「数据看板」入口（管理员可看统计图表）\n" +
                "- 回答模板：在导航栏点击「我的」进入个人中心，可以查看和修改个人资料、管理收货地址、查看购物车和订单。\n" +
                "\n" +
                "【用户管理（管理员）】\n" +
                "- 查看所有注册用户，支持按用户名/手机号搜索、按角色筛选\n" +
                "\n" +
                "【订单管理（管理员）】\n" +
                "- 管理员查看和处理所有订单（发货、退款等）\n" +
                "\n" +
                "【住户管理（管理员）】\n" +
                "- 管理员查看住户信息\n" +
                "\n" +
                "【数据看板（管理员）】\n" +
                "- 统计卡片：用户总数、订单总数、物业费收缴率、待处理报修数\n" +
                "- 图表：物业费缴纳饼图、订单状态柱状图、报修进度饼图\n" +
                "\n" +
                "=== 回答规范 ===\n" +
                "1. 回答时功能入口必须使用导航栏上的准确名称：居民端用「在线报修」「商品」「公告」「物业缴费」「访客预约」「建议反馈」「我的」；管理员端加上「订单管理」「住户管理」「公告管理」「用户管理」「访客审核」「缴费单管理」「建议管理」。\n" +
                "2. 不相关问题的统一回复：「抱歉，我是智慧社区专属助手，只能解答系统相关业务问题。您可以咨询在线报修、物业缴费、访客预约、商品购买、建议反馈等功能。」\n" +
                "3. 语气亲切友好，称呼用户为「您」，像社区管家一样。\n" +
                "4. 给出具体操作步骤，明确说明点击哪个导航菜单。\n" +
                "5. 涉及管理员功能时说明需要管理员权限。\n" +
                "6. 不用markdown格式，用自然段落分行。\n" +
                "7. 不编造系统中不存在的功能。\n" +
                "8. 回答控制在200字以内。";
    }
}
