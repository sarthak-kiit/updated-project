package com.sarthak.skillbuilder.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Around("execution(* com.sarthak.skillbuilder.service.*.*(..))")
    public Object logServiceMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        log.debug("Entering {}.{}()", className, methodName);
        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            log.debug("Exiting {}.{}() - took {}ms", className, methodName, System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.error("Exception in {}.{}(): {}", className, methodName, e.getMessage());
            throw e;
        }
    }

    @AfterThrowing(pointcut = "execution(* com.sarthak.skillbuilder.service.*.*(..))", throwing = "ex")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable ex) {
        log.error("Exception in {}.{}() with cause: {}",
                joinPoint.getSignature().getDeclaringTypeName(),
                joinPoint.getSignature().getName(),
                ex.getMessage());
    }
}
