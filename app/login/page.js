'use client';

import { useState } from 'react';
import styles from './page.module.css';

function getNextPath() {
    const nextPath = new URLSearchParams(window.location.search).get('next');
    return nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
}

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage('');
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password'),
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '登录失败');
            }

            window.location.replace(getNextPath());
        } catch (error) {
            setErrorMessage(error.message || '登录失败，请稍后重试');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={styles.loginPage}>
            <section className={styles.loginCard}>
                <div className={styles.logo}>VI</div>
                <h1 className={styles.title}>登录媒体预览站</h1>
                <p className={styles.description}>请输入账号密码后继续访问页面和 API。</p>

                <form className={styles.loginForm} onSubmit={handleSubmit}>
                    <label className={styles.formField}>
                        <span className={styles.fieldLabel}>用户名</span>
                        <input
                            className={styles.fieldInput}
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            autoFocus
                        />
                    </label>

                    <label className={styles.formField}>
                        <span className={styles.fieldLabel}>密码</span>
                        <input
                            className={styles.fieldInput}
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    {errorMessage ? (
                        <p className={styles.errorMessage} role="alert">{errorMessage}</p>
                    ) : null}

                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '登录中...' : '登录'}
                    </button>
                </form>
            </section>
        </main>
    );
}
