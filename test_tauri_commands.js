// Tauri 命令集成测试脚本
// 在浏览器控制台中执行此脚本

console.log('🧪 开始 Tauri 命令集成测试...\n');

const { invoke } = window.__TAURI__.core;
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// 辅助函数
function logTest(name, status, data, error = null) {
    const emoji = status === 'PASS' ? '✅' : '❌';
    console.log(`${emoji} ${name}: ${status}`);
    if (data) console.log('   数据:', data);
    if (error) console.log('   错误:', error);

    results.tests.push({ name, status, data, error });
    if (status === 'PASS') results.passed++;
    else results.failed++;
}

// 测试 1: 加载配置
async function test1_loadConfig() {
    console.log('\n📝 测试 1: 加载配置');
    try {
        const config = await invoke('load_config');
        logTest('load_config', 'PASS', config);
        return config;
    } catch (error) {
        logTest('load_config', 'FAIL', null, error);
        return null;
    }
}

// 测试 2: 列出账号
async function test2_listAccounts() {
    console.log('\n📝 测试 2: 列出所有账号');
    try {
        const accounts = await invoke('list_accounts');
        logTest('list_accounts', 'PASS', `找到 ${accounts.length} 个账号`);
        return accounts;
    } catch (error) {
        logTest('list_accounts', 'FAIL', null, error);
        return [];
    }
}

// 测试 3: 获取当前账号
async function test3_getCurrentAccount() {
    console.log('\n📝 测试 3: 获取当前账号');
    try {
        const current = await invoke('get_current_account');
        logTest('get_current_account', 'PASS', current);
        return current;
    } catch (error) {
        logTest('get_current_account', 'FAIL', null, error);
        return null;
    }
}

// 测试 4: 添加测试账号
async function test4_addAccount() {
    console.log('\n📝 测试 4: 添加测试账号');
    try {
        const testToken = {
            access_token: 'test_access_token_' + Date.now(),
            refresh_token: 'test_refresh_token_' + Date.now(),
            expires_at: new Date(Date.now() + 3600000).toISOString()
        };

        const newAccount = await invoke('add_account', {
            email: 'test_' + Date.now() + '@example.com',
            token: testToken
        });

        logTest('add_account', 'PASS', {
            id: newAccount.id,
            email: newAccount.email
        });
        return newAccount;
    } catch (error) {
        logTest('add_account', 'FAIL', null, error);
        return null;
    }
}

// 测试 5: 切换账号
async function test5_switchAccount(accountId) {
    console.log('\n📝 测试 5: 切换账号');
    if (!accountId) {
        logTest('switch_account', 'SKIP', '没有可切换的账号');
        return;
    }

    try {
        await invoke('switch_account', { accountId });
        logTest('switch_account', 'PASS', `切换到 ${accountId}`);

        // 验证切换成功
        const current = await invoke('get_current_account');
        if (current && current.id === accountId) {
            logTest('switch_account_verify', 'PASS', '切换验证成功');
        } else {
            logTest('switch_account_verify', 'FAIL', '切换验证失败');
        }
    } catch (error) {
        logTest('switch_account', 'FAIL', null, error);
    }
}

// 测试 6: 保存配置
async function test6_saveConfig() {
    console.log('\n📝 测试 6: 保存配置');
    try {
        const newConfig = {
            language: 'zh-CN',
            theme: 'dark',
            auto_refresh: true,
            refresh_interval: 30,
            auto_sync: false,
            sync_interval: 10
        };

        await invoke('save_config', { config: newConfig });
        logTest('save_config', 'PASS', newConfig);

        // 验证保存成功
        const loaded = await invoke('load_config');
        if (JSON.stringify(loaded) === JSON.stringify(newConfig)) {
            logTest('save_config_verify', 'PASS', '配置验证成功');
        } else {
            logTest('save_config_verify', 'FAIL', '配置验证失败');
        }
    } catch (error) {
        logTest('save_config', 'FAIL', null, error);
    }
}

// 测试 7: 删除账号
async function test7_deleteAccount(accountId) {
    console.log('\n📝 测试 7: 删除测试账号');
    if (!accountId) {
        logTest('delete_account', 'SKIP', '没有可删除的账号');
        return;
    }

    try {
        await invoke('delete_account', { accountId });
        logTest('delete_account', 'PASS', `删除账号 ${accountId}`);

        // 验证删除成功
        const accounts = await invoke('list_accounts');
        if (!accounts.some(a => a.id === accountId)) {
            logTest('delete_account_verify', 'PASS', '删除验证成功');
        } else {
            logTest('delete_account_verify', 'FAIL', '删除验证失败');
        }
    } catch (error) {
        logTest('delete_account', 'FAIL', null, error);
    }
}

// 主测试流程
async function runAllTests() {
    console.log('='.repeat(60));
    console.log('🚀 Tauri 命令集成测试');
    console.log('='.repeat(60));

    // 执行测试
    await test1_loadConfig();
    const initialAccounts = await test2_listAccounts();
    await test3_getCurrentAccount();
    const newAccount = await test4_addAccount();

    if (newAccount) {
        await test5_switchAccount(newAccount.id);
    }

    await test6_saveConfig();

    if (newAccount) {
        await test7_deleteAccount(newAccount.id);
    }

    // 输出总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));
    console.log(`✅ 通过: ${results.passed}`);
    console.log(`❌ 失败: ${results.failed}`);
    console.log(`📝 总计: ${results.tests.length}`);
    console.log(`🎯 成功率: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);

    // 返回结果
    return results;
}

// 执行测试
runAllTests().then(results => {
    console.log('\n✨ 测试完成! 结果已保存到 window.testResults');
    window.testResults = results;
});
