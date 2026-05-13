from reportlab.pdfgen import canvas

file_path = r"c:\Users\Pramodhya Kasuni\Documents\Xamk\Courses\AI in practice\Applied AI\Final project\procurement-app\Fake_Purchase_Order.pdf"
c = canvas.Canvas(file_path)

c.setFont('Helvetica-Bold', 24)
c.drawString(50, 770, 'PURCHASE ORDER')

c.setFont('Helvetica', 12)
c.drawString(50, 730, 'Date: April 18, 2026')
c.drawString(50, 710, 'To: Procurement Department')
c.drawString(50, 670, '------------------------------------------------')
c.drawString(50, 640, 'REQUESTED ITEM: Steel Bearing')
c.drawString(50, 610, 'ORDER QUANTITY: 75')
c.drawString(50, 580, 'PRICE PER UNIT: $100.00')
c.drawString(50, 550, 'TOTAL COST: $7,500.00')
c.drawString(50, 510, '------------------------------------------------')
c.drawString(50, 480, 'Authorized Signature: ___________________')

c.save()
print("Success")
