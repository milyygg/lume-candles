"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./store";
import { ServerCheckout } from "./server-checkout";
import { telegramContact, serverCheckout } from "@/lib/contact";
import { money } from "@/lib/config";
import { orderMessage, orderMessageParts } from "@/lib/order-message";
import { Arrow } from "./arrow";
export function Checkout(){return serverCheckout ? <ServerCheckout/> : <ConversationCheckout/>;}
function ConversationCheckout(){
 const cart=useCart();const [comment,setComment]=useState("");const [copied,setCopied]=useState(0);const [copyError,setCopyError]=useState(false);
 if(!cart.ready)return <p>Подготавливаем ваш выбор...</p>;
 if(!cart.items.length)return <div className="empty"><h1>Найдите свою свечу</h1><p>Коллекция начинается с формы, которая вам близка.</p><Link className="button" href="/catalog">Рассмотреть коллекцию <Arrow/></Link></div>;
 const message=orderMessage(cart.items,comment);const parts=orderMessageParts(message);
 return <><div className="page-heading"><h1>Почти ваша</h1><p>Осталось обсудить детали.<br/>Оплата после согласования заказа и доставки.</p></div><div className="checkout-layout conversation-checkout"><div className="checkout-form" data-ui><h2>Давайте познакомимся</h2><p>Скопируйте состав заказа и отправьте его нам в Telegram. Мы обсудим оформление, изготовление и удобную доставку.</p><label className="field">Пожелания к заказу<textarea rows={3} maxLength={500} value={comment} onChange={e=>{setComment(e.target.value);setCopied(0);}} placeholder="Повод, любимый оттенок или особенная идея"/></label><label className="field">Ваше сообщение<textarea className="order-message" aria-label="Состав заказа для отправки" readOnly value={message} rows={12} onFocus={e=>e.target.select()}/></label>{parts.length>1 && <p className="field-note">Ваша подборка получилась большой. Скопируйте и отправьте сообщения по очереди.</p>}{parts.map((part,index)=><button key={index} type="button" className={copied===index+1?"button wide added":"button wide"} onClick={async()=>{try{await navigator.clipboard.writeText(part);setCopied(index+1);setCopyError(false);}catch{setCopyError(true);}}}>{parts.length===1?(copied?"Состав скопирован":"Скопировать состав заказа"):`Скопировать часть ${index+1} из ${parts.length}`}<Arrow/></button>)}<p role="status">{copyError?"Выделите сообщение в поле выше и скопируйте его вручную.":copied?(parts.length>1?`Часть ${copied} скопирована. Вставьте сообщение в Telegram и отправьте его мастерской.`:"Теперь откройте Telegram, вставьте сообщение и отправьте его мастерской."):""}</p><a href={telegramContact} className="editorial-link" target="_blank" rel="noopener noreferrer"><span>Открыть Telegram</span><Arrow/></a><p className="field-note">Заказ поступит мастерской после того, как вы отправите сообщение в Telegram. Корзина остаётся сохранённой.</p></div><aside className="order-summary"><h2>Ваша композиция</h2><p>{cart.count} шт.</p><p className="summary-total">{money(cart.total)}</p><p>Стоимость выбранных изделий.<br/>Доставку согласуем отдельно.</p><Link href="/cart" className="text-link">Изменить корзину</Link><div className="summary-delivery"><p>СДЭК · Авито · Почта России</p><p>Оплата после согласования.</p></div></aside></div></>;
}
