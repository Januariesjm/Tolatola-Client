const fs = require('fs');
const file = '/home/januaries/Desktop/Tolatola/multivendor-marketplace-build/Tolatola-Client/components/payment/payment-content.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  useEffect(() => {
    if (paymentCompleted) {
      router.push('/checkout/success/' + order.id)
    }
  }, [paymentCompleted, order.id, router])

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center pb-20">
        <div className="animate-pulse flex items-center gap-3 text-stone-500 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-bold text-sm tracking-wide">Redirecting to order confirmation...</span>
        </div>
      </div>
    )
  }`;

const startIndex = content.indexOf('  const handleConfirmDelivery = async () => {');
const endIndex = content.indexOf('  return (\n    <div className="min-h-screen bg-[#FDFCFB] pb-20">\n      <div className="container mx-auto');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement + '\n' + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log("Success modifying payment-content.tsx");
} else {
  console.log("Could not find blocks", startIndex, endIndex);
}
