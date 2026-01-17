"use client";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Form } from "react-bootstrap";
import image from "@/assets/images/resources/login-1-1.jpg";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginSection: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { login } = useAuth();
  
  const togglePasswordVisibility = (e: any) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      setIsLoading(true);
      setError("");
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className='login-page section-space'>
      <div className='container'>
        <div className='row gutter-y-40 align-items-center'>
          <div className='col-lg-6'>
            <div className='login-page__thumb'>
              <Image src={image} alt='gotur image' />
            </div>
          </div>
          <div className='col-lg-6'>
            <div className='login-page__content'>
              <div className='login-page__main-tab-box'>
                <div className='login-page__top'>
                  <div className='login-page__top__left'>
                    <h2 className='login-page__top__section-title'>Admin Login</h2>
                    <p className='login-page__top__section-subtitle'>
                      Sign in to access the dashboard
                    </p>
                  </div>
                </div>

                {error && (
                  <div className='alert alert-danger' role='alert'>
                    {error}
                  </div>
                )}

                <div className='tabs-content'>
                  <div className='tabs-content__item tab wow fadeInUp active-tab'>
                    <Form onSubmit={handleSubmit(onLoginSubmit)}>
                      <div className='login-page__group'>
                        <div className='login-page__input-box'>
                          <i className='icon-email'></i>

                          <input
                            type='text'
                            placeholder='Enter your email'
                            {...register("email", {
                              required: "Email is required",
                              pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                              }
                            })}
                            disabled={isLoading}
                          />
                          {errors.email && (
                            <span className='text-danger small'>{errors.email.message}</span>
                          )}
                        </div>

                        <div className='login-page__input-box'>
                          <i className='icon-padlock'></i>
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder='Password'
                            {...register("password", {
                              required: "Password is required",
                              minLength: {
                                value: 6,
                                message: "Password must be at least 6 characters"
                              }
                            })}
                            disabled={isLoading}
                          />
                          <span
                            onClick={(e) => togglePasswordVisibility(e)}
                            className={`toggle-password pass-field-icon fa fa-fw ${
                              showPassword ? "fa-eye" : "fa-eye-slash"
                            }`}
                          ></span>
                          {errors.password && (
                            <span className='text-danger small d-block mt-1'>{errors.password.message}</span>
                          )}
                        </div>

                        <div className='login-page__input-box login-page__input-box--bottom'>
                          <div className='login-page__input-box__inner'>
                            <input
                              id='rememberMe'
                              type='checkbox'
                              className='login-page__input-box__inner'
                              {...register("rememberMe")}
                            />
                            <label htmlFor='rememberMe'>Remember me</label>
                          </div>
                        </div>

                        <div className='login-page__input-box'>
                          <div className='login-page__input-box__btn'>
                            <button 
                              type='submit' 
                              className='gotur-btn'
                              disabled={isLoading}
                            >
                              {isLoading ? "Logging in..." : "Log in"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginSection;
