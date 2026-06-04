export function formatCurrency(value) {
  const num = Number(value) || 0
  return `R$ ${num.toFixed(2)}`
}

export function formatShareText(categories, items) {
  let text = 'SmartCheck - Minha Lista de Compras\n\n'
  for (const cat of categories) {
    text += `${cat.name}\n`
    const catItems = items.filter(i => i.categoryId === cat.id)
    for (const item of catItems) {
      text += `- ${item.name} (${item.quantity}x)`
      if (item.price > 0) text += ` - ${formatCurrency(item.price)}`
      text += '\n'
    }
    text += '\n'
  }
  text += 'Criado com SmartCheck'
  return text
}
